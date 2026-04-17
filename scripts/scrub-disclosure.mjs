#!/usr/bin/env node
/**
 * Scrub AdRecon "operator relationship" language from existing MDX content.
 *
 * Strategy: scan every MDX file in src/content/{listicles,intent,guides,reviews,versus}
 * for sentences that reveal AdRecon operates AffiliateTools.co. Remove those
 * sentences in-place. Also strip full paragraphs that are 70%+ disclosure.
 *
 * Idempotent — safe to run multiple times. Supports --dry-run.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

/** Sentence-level patterns that identify operator-disclosure/self-reveal language. */
const DISCLOSURE_PATTERNS = [
  // ----- Direct "operated by AdRecon" variants -----
  /AffiliateTools\.co\s+(?:is\s+)?(?:operated|run|owned)\s+by[^.]*\.(?:\s|$)/gi,
  /This\s+(?:site|directory|review\s+site)\s+(?:is\s+)?(?:operated|run|owned)\s+by[^.]*\.(?:\s|$)/gi,
  /(?:we\s+at|the\s+team\s+behind)\s+AdRecon[^.]*\.(?:\s|$)/gi,
  /AdRecon\s+(?:team|operates|runs|owns|built|created)\s+(?:this|AffiliateTools)[^.]*\.(?:\s|$)/gi,
  /(?:operated\s+by|built\s+by|run\s+by)\s+the\s+AdRecon\s+team[^.]*\.(?:\s|$)/gi,

  // ----- Full-disclosure self-ID sentences -----
  // Cover any sentence starting with "Full disclosure" or "As a full disclosure" etc.
  /(?:\*\s*)?(?:As\s+a\s+)?Full\s+disclosure[,:]?[^.!?\n]*[.!?]+\s*/gi,
  /(?:\*\s*)?(?:As\s+a\s+)?Full\s+disclosure[,:]?[^.!?\n]*\*?\s*(?=\n|$)/gi,
  /\*\s*Full\s+disclosure[^*]*\*/gi,
  /(?:Disclosure|Disclaimer)[:\s]+[^.!?\n]*(?:AdRecon|competit|vested|own\s+tool|our\s+tool)[^.!?\n]*[.!?]+\s*/gi,

  // ----- Self-identification as a tool builder/competitor -----
  // "we are competitors / direct competitors to [some or most of] the tools on this list"
  /[Ww]e(?:'re|\s+are)\s+(?:direct\s+)?competitors?\s+(?:to|with)\s+(?:several|most|some|the|all)?\s*(?:of\s+the\s+)?tools?\b[^.!?\n]*[.!?]+\s*/gi,
  // "AdRecon is a direct competitor to the tools reviewed"
  /AdRecon\s+is\s+a\s+(?:direct\s+)?competitor\s+to\s+(?:most\s+of\s+the\s+tools|several\s+of\s+the\s+tools|the\s+tool[s]?\s+reviewed|the\s+tools\s+on\s+this\s+list)[^.!?\n]*[.!?]+\s*/gi,
  // "We built AdRecon" / "we run AdRecon" / "we built the tool"
  /[Ww]e\s+(?:built|run|operate|own|created|founded|launched|developed)\s+(?:AdRecon|this\s+tool|the\s+tool|our\s+tool)[^.!?\n]*[.!?]+\s*/gi,
  // "We built the tool because we were tired of..."
  /[Ww]e\s+built\s+the\s+tool\b[^.!?\n]*[.!?]+\s*/gi,
  // "we are biased" / "we have a vested interest"
  /[Ww]e(?:'re|\s+are)\s+biased\b[^.!?\n]*[.!?]+\s*/gi,
  /[Ww]e\s+have\s+a\s+vested\s+interest\b[^.!?\n]*[.!?]+\s*/gi,
  /[Ww]e(?:'re|\s+are)\s+in\s+the\s+arena\b[^.!?\n]*[.!?]+\s*/gi,
  // "our own philosophy" / "our own tool" / "our tool"
  /[Oo]ur\s+(?:own\s+)?(?:tool|product|platform|philosophy|offering|approach|stack)[^.!?\n]*(?:AdRecon|success|philosophy|outperform[s]?)[^.!?\n]*[.!?]+\s*/gi,
  /[Oo]ur\s+current\s+offering[^.!?\n]*[.!?]+\s*/gi,
  // "maintain editorial honesty / integrity" when tied to self-competition
  /(?:To\s+)?maintain\s+editorial\s+(?:honesty|integrity)[,.\s]+(?:we\s+)?(?:explicitly\s+)?(?:call\s+out|highlight|point\s+out|acknowledge)\s+where\s+(?:competitors?|our\s+)[^.!?\n]*[.!?]+\s*/gi,
  // "we will tell you exactly where our competitors beat us"
  /[Ww]e\s+(?:will|can|do|'ll)\s+(?:tell|say|acknowledge|admit|call\s+out|highlight|show)\s+(?:you\s+)?(?:exactly\s+)?where\s+(?:our\s+)?competitors?\s+(?:beat|outperform|win\s+over|surpass)\s+(?:us|our\s+tool|AdRecon)[^.!?\n]*[.!?]+\s*/gi,
  // "competitors beat us" / "competitors outperform us"
  /(?:competitors?|a\s+competitor)\s+(?:beat|outperform|surpass)[s]?\s+us\b[^.!?\n]*[.!?]+\s*/gi,

  // ----- The conspicuous CTA framing -----
  /From\s+our\s+operator\s*·?\s*AdRecon[^.!?\n]*[.!?]?\s*/gi,
  /admits?\s+where\s+(?:our\s+)?(?:own\s+)?(?:tool|AdRecon)\s+loses[^.!?\n]*[.!?]+\s*/gi,
  /[Ww]e(?:'re|\s+are)\s+the\s+operator[s]?\s+of\s+this\s+(?:site|directory)[^.!?\n]*[.!?]+\s*/gi,

  // ----- Phrases that reveal "insider" framing -----
  // "from the operator's seat" / "operator seat"
  /from\s+the\s+operator'?s?\s+seat[^.!?\n]*[.!?]+\s*/gi,
  // "affiliate-built stack" / "affiliate-built"
  /affiliate-built\s+stack\b[^.!?\n]*[.!?]+\s*/gi,
  // Generic "we are one of the tools on this list"
  /[Ww]e(?:'re|\s+are)\s+one\s+of\s+the\s+tools\b[^.!?\n]*[.!?]+\s*/gi,

  // ----- Markdown-wrapped disclosures (italic or bold) -----
  // *Note: we are direct competitors...*  or  **...we are competitors...**
  /\*+\s*(?:Note\s*:\s*)?[Ww]e(?:'re|\s+are)\s+(?:direct\s+)?competitors?\b[^*\n]*\*+/g,
  // **AdRecon, our own tool, ...**  — bold statements revealing ownership
  /\*+[^*\n]*\b(?:our\s+own\s+tool|our\s+tool|operator|competitors?\s+to\s+the\s+other)\b[^*\n]*\*+/gi,

  // ----- "our own tool" / "our tool" inline claims tied to AdRecon -----
  /\bAdRecon,?\s+our\s+own\s+tool,[^.!?\n]*[.!?]+\s*/gi,
  /\bour\s+own\s+tool\s+(?:is\s+)?AdRecon\b[^.!?\n]*[.!?]+\s*/gi,
];

/**
 * Scrub a single block of MDX text. Returns the scrubbed text.
 * Also removes any paragraph that is now empty, plus heavy-disclosure paragraphs.
 */
function scrub(text) {
  let out = text;

  // Pass 1: remove whole sentences matching patterns.
  for (const re of DISCLOSURE_PATTERNS) {
    out = out.replace(re, ' ');
  }

  // Pass 2: remove paragraphs where the remaining keywords still point at
  // operator disclosure (heuristic: paragraphs that mention both "AdRecon"
  // and "operate"/"operator"/"disclos").
  out = out
    .split(/\n{2,}/)
    .filter((para) => {
      const p = para.toLowerCase();
      const hasAdRecon = p.includes('adrecon');
      const hasDisclose = /\b(operate|operator|operated|disclose[ds]?|conflict of interest|run by the team|owned by)\b/.test(p);
      // If both signals appear in a short-ish paragraph, drop it.
      if (hasAdRecon && hasDisclose && para.length < 600) return false;
      return true;
    })
    .join('\n\n');

  // Collapse runs of blank lines.
  out = out.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

  // Clean up stray double spaces left by sentence removals.
  out = out.replace(/[ \t]{2,}/g, ' ');
  out = out.replace(/\(\s*\)/g, '');
  out = out.replace(/\s+([.,;:])/g, '$1');

  return out;
}

/** Split frontmatter from body. */
function split(raw) {
  if (!raw.startsWith('---')) return { fm: '', body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { fm: '', body: raw };
  return { fm: raw.slice(0, end + 4) + '\n', body: raw.slice(end + 4).replace(/^\n+/, '') };
}

const DIRS = ['listicles', 'intent', 'guides', 'reviews', 'versus'];
let changed = 0;
let unchanged = 0;
let scanned = 0;

for (const dir of DIRS) {
  const full = path.join(ROOT, 'src/content', dir);
  if (!fs.existsSync(full)) continue;
  for (const f of fs.readdirSync(full)) {
    if (!f.endsWith('.mdx') && !f.endsWith('.md')) continue;
    scanned += 1;
    const abs = path.join(full, f);
    const raw = fs.readFileSync(abs, 'utf8');
    const { fm, body } = split(raw);
    const cleaned = scrub(body);
    if (cleaned === body) {
      unchanged += 1;
      continue;
    }
    if (!dryRun) fs.writeFileSync(abs, fm + cleaned, 'utf8');
    changed += 1;
    console.log(`  ${dryRun ? 'would-scrub' : 'scrubbed'} ${dir}/${f}`);
  }
}

console.log(`\nDone. Scrubbed ${changed}, unchanged ${unchanged}, scanned ${scanned}.${dryRun ? ' (DRY RUN)' : ''}`);
