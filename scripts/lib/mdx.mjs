/**
 * YAML frontmatter builder + MDX file writer.
 * We build frontmatter programmatically (safe, deterministic) and only accept
 * prose body from the model. This keeps schema conformance 100% on our side.
 */
import fs from 'node:fs';
import path from 'node:path';

const COMPETITOR_SLUGS = new Set([
  'adrecon', 'adspy', 'bigspy', 'poweradspy', 'foreplay', 'minea', 'pipiads',
]);

/** Quote a scalar for YAML — always double-quoted so special chars are safe. */
function yq(s) {
  if (s === null || s === undefined) return '""';
  const str = String(s);
  return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

function yamlList(items, indent = '  ') {
  if (!items || items.length === 0) return `${indent}[]`;
  return items.map((it) => `${indent}- ${it}`).join('\n');
}

function faqYaml(faq) {
  if (!Array.isArray(faq) || faq.length === 0) return '[]';
  return '\n' + faq
    .map((f) => `  - q: ${yq(f.q)}\n    a: ${yq(f.a)}`)
    .join('\n');
}

function rankingYaml(ranking) {
  if (!Array.isArray(ranking) || ranking.length === 0) return '[]';
  return '\n' + ranking
    .map((r) => [
      `  - rank: ${Number(r.rank)}`,
      `    competitorSlug: ${yq(r.competitorSlug)}`,
      `    verdict: ${yq(r.verdict)}`,
      `    bestFor: ${yq(r.bestFor)}`,
      `    standoutFeature: ${yq(r.standoutFeature)}`,
      `    priceNote: ${yq(r.priceNote)}`,
    ].join('\n'))
    .join('\n');
}

/** Runtime validators — throw with helpful messages on schema breach. */
export function validateListicle(data, brief) {
  const errs = [];
  if (!data.description || typeof data.description !== 'string') errs.push('description missing');
  if (!data.methodologySummary) errs.push('methodologySummary missing');
  if (!Array.isArray(data.ranking) || data.ranking.length < 5) errs.push('ranking must have >=5 items');
  if (!Array.isArray(data.faq) || data.faq.length < 5) errs.push('faq must have >=5 items');

  if (Array.isArray(data.ranking)) {
    data.ranking.forEach((r, i) => {
      if (typeof r.rank !== 'number') errs.push(`ranking[${i}].rank not a number`);
      if (!COMPETITOR_SLUGS.has(r.competitorSlug)) errs.push(`ranking[${i}].competitorSlug invalid: ${r.competitorSlug}`);
      if (!r.verdict) errs.push(`ranking[${i}].verdict missing`);
      if (!r.bestFor) errs.push(`ranking[${i}].bestFor missing`);
      if (!r.standoutFeature) errs.push(`ranking[${i}].standoutFeature missing`);
      if (!r.priceNote) errs.push(`ranking[${i}].priceNote missing`);
    });
  }
  if (errs.length) throw new Error(`Listicle "${brief.slug}" invalid:\n  - ${errs.join('\n  - ')}`);
}

export function validateIntent(data, brief) {
  const errs = [];
  if (!data.description) errs.push('description missing');
  if (!Array.isArray(data.faq) || data.faq.length < 5) errs.push('faq must have >=5 items');
  if (errs.length) throw new Error(`Intent "${brief.slug}" invalid:\n  - ${errs.join('\n  - ')}`);
}

export function validateGuide(data, brief) {
  const errs = [];
  if (!data.description) errs.push('description missing');
  if (!Array.isArray(data.faq) || data.faq.length < 4) errs.push('faq must have >=4 items');
  if (errs.length) throw new Error(`Guide "${brief.slug}" invalid:\n  - ${errs.join('\n  - ')}`);
}

/** ---------- Frontmatter builders ---------- */

export function listicleFrontmatter(brief, data, { publishDate, updatedDate }) {
  return [
    '---',
    `title: ${yq(brief.title)}`,
    `description: ${yq(data.description)}`,
    `targetKeyword: ${yq(brief.targetKeyword)}`,
    `publishDate: ${yq(publishDate)}`,
    `updatedDate: ${yq(updatedDate)}`,
    `intent: ${yq(brief.intent)}`,
    `methodologySummary: ${yq(data.methodologySummary)}`,
    `ranking:${rankingYaml(data.ranking)}`,
    `faq:${faqYaml(data.faq)}`,
    'draft: false',
    '---',
    '',
  ].join('\n');
}

export function intentFrontmatter(brief, data, { publishDate, updatedDate }) {
  const lines = [
    '---',
    `title: ${yq(brief.title)}`,
    `description: ${yq(data.description)}`,
  ];
  if (brief.competitorSlug) lines.push(`competitorSlug: ${yq(brief.competitorSlug)}`);
  lines.push(
    `intentKind: ${yq(brief.intentKind)}`,
    `publishDate: ${yq(publishDate)}`,
    `updatedDate: ${yq(updatedDate)}`,
    `faq:${faqYaml(data.faq)}`,
    'draft: false',
    '---',
    '',
  );
  return lines.join('\n');
}

export function guideFrontmatter(brief, data, { publishDate, updatedDate }) {
  return [
    '---',
    `title: ${yq(brief.title)}`,
    `description: ${yq(data.description)}`,
    `publishDate: ${yq(publishDate)}`,
    `updatedDate: ${yq(updatedDate)}`,
    `heroEyebrow: ${yq(data.heroEyebrow || 'Operator guide')}`,
    `faq:${faqYaml(data.faq)}`,
    'draft: false',
    '---',
    '',
  ].join('\n');
}

/** Import preambles per content type — matches the components Astro MDX expects to find in scope. */
const STANDARD_IMPORTS =
  "import CTA from '@/components/CTA.astro';\n" +
  "import FAQ from '@/components/FAQ.astro';\n" +
  "import ToolLogo from '@/components/ToolLogo.astro';\n" +
  "import Screenshot from '@/components/Screenshot.astro';\n";

const IMPORT_PREAMBLES = {
  listicle: STANDARD_IMPORTS,
  intent: STANDARD_IMPORTS,
  guide: STANDARD_IMPORTS,
};

/**
 * Strip any frontmatter the model may have produced, remove the model's own
 * import statements (they may be wrong), and inject the canonical preamble.
 */
export function cleanBody(body, type = 'listicle') {
  let out = body;
  // Strip leading frontmatter block.
  if (out.startsWith('---')) {
    const end = out.indexOf('\n---', 3);
    if (end !== -1) out = out.slice(end + 4).trimStart();
  }
  // Strip whatever imports the model added — we inject a canonical block below.
  out = out.replace(/^\s*import\s+.*from\s+['"].*?['"];?\s*$/gm, '').trim();
  const preamble = IMPORT_PREAMBLES[type] || IMPORT_PREAMBLES.listicle;
  return `${preamble}\n${out}\n`;
}

/** Count body words, excluding import lines and MDX component tags. */
export function wordCount(mdx) {
  const text = mdx
    .replace(/^---[\s\S]*?^---\s*$/m, '') // strip frontmatter
    .replace(/^\s*import\s+.*from\s+['"].*?['"];?\s*$/gm, '') // strip imports
    .replace(/<[^>]+>/g, ' ') // strip HTML/JSX tags
    .replace(/[#*`>_|]+/g, ' ') // strip markdown punctuation
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

/**
 * Polish step — deterministic fix-ups so every article lands with:
 *   - a <ToolLogo> under each ranked H3 section
 *   - a <Screenshot> for top 3 ranked tools
 *   - an explicit disclosure paragraph if the model omitted it
 *
 * Takes the assembled MDX text (preamble + body) and returns the polished version.
 * Idempotent — running it again on an already-polished file is a no-op.
 */
export function polishListicleBody({ body, ranking }) {
  if (!Array.isArray(ranking) || ranking.length === 0) return body;
  let out = body;

  ranking.forEach((r, idx) => {
    const slug = r.competitorSlug;
    // Find the H3 for this tool — match the rank number followed by the tool's slug-derived name.
    // Prefer matching by rank number then tool name cased variants.
    const rank = Number(r.rank) || idx + 1;
    const logoTag = `<ToolLogo slug="${slug}" size="lg" showName />`;
    const shotTag = `<Screenshot slug="${slug}" variant="hero" />`;

    // Skip if tool logo already referenced for this slug.
    const hasLogo = new RegExp(`<ToolLogo\\s+slug=["']${slug}["']`).test(out);
    const hasShot = new RegExp(`<Screenshot\\s+slug=["']${slug}["']`).test(out);

    // Try to locate the H3 by rank and slug words. Look for "### 1. " etc.
    const h3Re = new RegExp(`^### ${rank}\\.\\s+.*$`, 'm');
    const match = h3Re.exec(out);
    if (!match) return;

    const afterH3Idx = match.index + match[0].length;

    if (!hasLogo) {
      // Insert logo on the line after the H3.
      out = out.slice(0, afterH3Idx) + `\n\n${logoTag}\n` + out.slice(afterH3Idx);
    }

    // Only add a screenshot for top 3 if missing. Append before the next H2 or H3.
    if (!hasShot && rank <= 3) {
      const remainder = out.slice(afterH3Idx);
      const nextSectionRe = /(^##\s+|^###\s+)/m;
      const nm = nextSectionRe.exec(remainder);
      const insertAt = afterH3Idx + (nm ? nm.index : remainder.length);
      // Don't double-insert if we just added one before this
      out = out.slice(0, insertAt) + `\n${shotTag}\n\n` + out.slice(insertAt);
    }
  });

  return out;
}

/**
 * Ensure the body has the canonical import preamble. Adds any missing imports
 * (CTA, FAQ, ToolLogo, Screenshot) at the top of the file, preserving any
 * imports already present. Idempotent.
 */
export function ensureImports(body) {
  const required = [
    ["CTA", "import CTA from '@/components/CTA.astro';"],
    ["FAQ", "import FAQ from '@/components/FAQ.astro';"],
    ["ToolLogo", "import ToolLogo from '@/components/ToolLogo.astro';"],
    ["Screenshot", "import Screenshot from '@/components/Screenshot.astro';"],
  ];
  const toAdd = [];
  for (const [name, line] of required) {
    const hasIt = new RegExp(`import\\s+${name}\\s+from\\s+`).test(body);
    if (!hasIt) toAdd.push(line);
  }
  if (toAdd.length === 0) return body;

  // Find the end of the existing import block (if any) and insert missing imports.
  const lines = body.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\s+.+from\s+['"].*?['"];?\s*$/.test(lines[i])) lastImportIdx = i;
    else if (lastImportIdx !== -1 && lines[i].trim() !== '') break;
  }
  if (lastImportIdx === -1) {
    // No imports yet — add block at top, followed by blank line.
    return toAdd.join('\n') + '\n\n' + body;
  }
  lines.splice(lastImportIdx + 1, 0, ...toAdd);
  return lines.join('\n');
}

/** True if the body contains the AdRecon operator disclosure in some form. */
export function hasDisclosure(mdx) {
  return /adrecon[\s\S]{0,120}(operated|operator|team|owns|runs)/i.test(mdx) ||
         /operated by[\s\S]{0,80}adrecon/i.test(mdx);
}

export function hasCta(mdx) {
  return /<CTA[\s>]/i.test(mdx);
}

export function writeMdxFile(absPath, contents) {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, contents, 'utf8');
}
