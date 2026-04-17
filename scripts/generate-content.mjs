#!/usr/bin/env node
/**
 * AffiliateTools.co content pipeline.
 *
 * Reads scripts/content-briefs.json, calls OpenRouter for each brief, validates
 * the structured response, and writes a new MDX file to the correct content
 * collection directory.
 *
 * Flags:
 *   --only=slug,slug     Only generate briefs with matching slug(s)
 *   --force              Overwrite existing files
 *   --dry-run            Call the API but do not write files
 *   --limit=N            Stop after N successful generations
 *   --concurrency=N      Parallelism (default 3, cap 6 — free tier is rate-limited)
 *
 * Reads .env for:
 *   OPENROUTER_API_KEY
 *   OPENROUTER_MODEL              (default google/gemma-4-31b-it:free)
 *   OPENROUTER_FALLBACK_MODEL     (default google/gemma-3-27b-it:free)
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import process from 'node:process';

import { callModel, OpenRouterError } from './lib/openrouter.mjs';
import {
  buildListiclePrompt,
  buildIntentPrompt,
  buildGuidePrompt,
  parseModelResponse,
} from './lib/prompts.mjs';
import {
  validateListicle,
  validateIntent,
  validateGuide,
  listicleFrontmatter,
  intentFrontmatter,
  guideFrontmatter,
  cleanBody,
  writeMdxFile,
  wordCount,
  polishListicleBody,
  hasDisclosure,
  hasCta,
} from './lib/mdx.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** Tiny .env parser — no dependency. */
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    // Strip optional surrounding quotes.
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnv(path.join(ROOT, '.env'));

const MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
const FALLBACK = process.env.OPENROUTER_FALLBACK_MODEL || 'google/gemma-3-27b-it:free';

/** Parse CLI flags. */
function parseArgs(argv) {
  const out = { force: false, dryRun: false, only: null, limit: Infinity, concurrency: 3, briefs: 'content-briefs.json' };
  for (const arg of argv.slice(2)) {
    if (arg === '--force') out.force = true;
    else if (arg === '--dry-run') out.dryRun = true;
    else if (arg.startsWith('--only=')) out.only = new Set(arg.slice(7).split(',').map((s) => s.trim()).filter(Boolean));
    else if (arg.startsWith('--limit=')) out.limit = parseInt(arg.slice(8), 10) || Infinity;
    else if (arg.startsWith('--concurrency=')) out.concurrency = Math.min(6, Math.max(1, parseInt(arg.slice(14), 10) || 3));
    else if (arg.startsWith('--briefs=')) out.briefs = arg.slice(9);
  }
  return out;
}
const args = parseArgs(process.argv);

/** Resolve the output path for a brief. */
function outputPath(brief) {
  switch (brief.type) {
    case 'listicle': return path.join(ROOT, 'src/content/listicles', `${brief.slug}.mdx`);
    case 'intent':   return path.join(ROOT, 'src/content/intent',    `${brief.slug}.mdx`);
    case 'guide':    return path.join(ROOT, 'src/content/guides',    `${brief.slug}.mdx`);
    default: throw new Error(`Unknown brief type: ${brief.type}`);
  }
}

/** Build the frontmatter + validate the model's JSON payload for the given type. */
function assembleFile(brief, data, body, dates) {
  let cleaned;
  let frontmatter;
  switch (brief.type) {
    case 'listicle':
      validateListicle(data, brief);
      frontmatter = listicleFrontmatter(brief, data, dates);
      cleaned = cleanBody(body, 'listicle');
      // Polish: auto-inject missing ToolLogo for each ranked tool, Screenshot for top 3.
      cleaned = polishListicleBody({ body: cleaned, ranking: data.ranking });
      break;
    case 'intent':
      validateIntent(data, brief);
      frontmatter = intentFrontmatter(brief, data, dates);
      cleaned = cleanBody(body, 'intent');
      break;
    case 'guide':
      validateGuide(data, brief);
      frontmatter = guideFrontmatter(brief, data, dates);
      cleaned = cleanBody(body, 'guide');
      break;
    default: throw new Error(`Unknown type: ${brief.type}`);
  }
  return frontmatter + cleaned;
}

const MIN_WORD_COUNT = 1600; // soft floor — retries trigger below this
const TARGET_WORD_COUNT = 2800; // aspirational — we report but don't fail above min

/** Review step — returns { ok, issues[] } without side-effects.
 *  Note: we INVERT the disclosure check — articles must NOT claim any
 *  operator relationship between this site and AdRecon. */
function review(contents, brief) {
  const issues = [];
  const wc = wordCount(contents);
  if (wc < MIN_WORD_COUNT) issues.push(`word count ${wc} below floor ${MIN_WORD_COUNT}`);
  if (hasDisclosure(contents)) issues.push('operator-disclosure language present (should be scrubbed)');
  if (!hasCta(contents)) issues.push('CTA component missing');
  return { ok: issues.length === 0, issues, wc };
}

function promptFor(brief) {
  switch (brief.type) {
    case 'listicle': return buildListiclePrompt(brief);
    case 'intent':   return buildIntentPrompt(brief);
    case 'guide':    return buildGuidePrompt(brief);
    default: throw new Error(`Unknown type: ${brief.type}`);
  }
}

/** Today in YYYY-MM-DD. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

const MAX_ATTEMPTS = 3;

async function generateOne(brief, dates) {
  const outPath = outputPath(brief);
  if (!args.force && fs.existsSync(outPath)) {
    return { brief, status: 'skipped', reason: 'file exists (use --force to overwrite)', outPath };
  }

  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const messages = promptFor(brief);
      const { text, modelUsed } = await callModel({
        messages,
        model: MODEL,
        fallbackModel: FALLBACK,
        temperature: 0.5 + attempt * 0.05, // nudge temperature on retry
        maxTokens: 8192, // 3000+ word targets need headroom for prose + components
      });

      const { data, body } = parseModelResponse(text);
      const contents = assembleFile(brief, data, body, dates);

      // Review gate — word count + disclosure + CTA. Below floor → retry.
      const { ok, issues, wc } = review(contents, brief);
      if (!ok && attempt < MAX_ATTEMPTS) {
        process.stderr.write(`\n  review-fail ${brief.slug} (attempt ${attempt}, ${wc}w): ${issues.join(', ')}\n`);
        continue;
      }

      if (!args.dryRun) writeMdxFile(outPath, contents);
      return {
        brief,
        status: ok ? 'ok' : 'warn',
        outPath,
        model: modelUsed,
        attempts: attempt,
        bytes: contents.length,
        wordCount: wc,
        issues,
      };
    } catch (err) {
      lastErr = err;
      const msg = err instanceof OpenRouterError
        ? `[OpenRouter ${err.status ?? '?'}] ${err.message} (model=${err.model})`
        : err.message;
      process.stderr.write(`\n  retry ${brief.slug} (attempt ${attempt}): ${msg.slice(0, 300)}\n`);
    }
  }

  return { brief, status: 'failed', error: lastErr?.message ?? 'unknown', outPath };
}

/** Simple promise-pool concurrency. */
async function runPool(items, worker, size) {
  const results = [];
  let idx = 0;
  const active = new Set();
  while (idx < items.length || active.size) {
    while (active.size < size && idx < items.length) {
      const cur = items[idx++];
      const p = Promise.resolve(worker(cur)).then((r) => {
        active.delete(p);
        return r;
      });
      active.add(p);
      results.push(p);
    }
    if (active.size) await Promise.race(active);
  }
  return Promise.all(results);
}

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY missing. Add it to .env (see .env.example).');
    process.exit(1);
  }

  const briefsPath = path.isAbsolute(args.briefs) ? args.briefs : path.join(__dirname, args.briefs);
  const { briefs } = JSON.parse(fs.readFileSync(briefsPath, 'utf8'));
  let selected = briefs;
  if (args.only) selected = briefs.filter((b) => args.only.has(b.slug));
  if (Number.isFinite(args.limit)) selected = selected.slice(0, args.limit);

  const dates = { publishDate: today(), updatedDate: today() };

  const mode = args.dryRun ? 'DRY-RUN' : 'LIVE';
  console.log(
    `\n${mode} · model=${MODEL} · fallback=${FALLBACK} · ${selected.length} brief(s) · concurrency=${args.concurrency}\n`
  );

  let done = 0;
  const results = await runPool(selected, async (brief) => {
    const t0 = Date.now();
    const r = await generateOne(brief, dates);
    done += 1;
    const dur = ((Date.now() - t0) / 1000).toFixed(1);
    const icon = r.status === 'ok' ? '✓' : r.status === 'warn' ? '~' : r.status === 'skipped' ? '-' : '✗';
    const wcTag = typeof r.wordCount === 'number' ? ` · ${r.wordCount}w` : '';
    const warnTag = r.status === 'warn' && r.issues?.length ? ` · issues: ${r.issues.join(', ').slice(0, 100)}` : '';
    const line = `${icon} [${done}/${selected.length}] ${brief.type}/${brief.slug} · ${dur}s${wcTag} · ${r.status}${warnTag}${r.status === 'failed' ? ' · ' + (r.error ?? '').slice(0, 180) : ''}`;
    console.log(line);
    return r;
  }, args.concurrency);

  const ok = results.filter((r) => r.status === 'ok').length;
  const warn = results.filter((r) => r.status === 'warn').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed');
  const wcVals = results.filter((r) => typeof r.wordCount === 'number').map((r) => r.wordCount);
  const avgWc = wcVals.length ? Math.round(wcVals.reduce((a, b) => a + b, 0) / wcVals.length) : 0;

  console.log('');
  console.log(`Summary: ${ok} clean, ${warn} warn, ${skipped} skipped, ${failed.length} failed · avg ${avgWc} words`);
  if (warn) {
    console.log('\nWarnings (published but flagged):');
    for (const r of results.filter((x) => x.status === 'warn')) {
      console.log(`  ~ ${r.brief.slug} (${r.wordCount}w): ${(r.issues ?? []).join(', ')}`);
    }
  }
  if (failed.length) {
    console.log('\nFailures:');
    for (const f of failed) console.log(`  ✗ ${f.brief.slug}: ${(f.error ?? '').split('\n')[0].slice(0, 200)}`);
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
