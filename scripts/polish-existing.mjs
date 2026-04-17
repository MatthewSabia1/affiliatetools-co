#!/usr/bin/env node
/**
 * Retrofit existing listicle MDX files with <ToolLogo> + <Screenshot> components
 * for every ranked tool. Idempotent — safe to run multiple times.
 *
 * Usage: node scripts/polish-existing.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { polishListicleBody, ensureImports } from './lib/mdx.mjs';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LISTICLES_DIR = path.join(ROOT, 'src/content/listicles');

const dryRun = process.argv.includes('--dry-run');

/** Tiny frontmatter parser — extracts the YAML block and returns raw body. */
function split(raw) {
  if (!raw.startsWith('---')) return { fm: '', body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { fm: '', body: raw };
  return { fm: raw.slice(0, end + 4), body: raw.slice(end + 4).replace(/^\n+/, '') };
}

/** Extract the `ranking:` list from YAML frontmatter — purpose-built for our schema. */
function extractRanking(fm) {
  const lines = fm.split('\n');
  const start = lines.findIndex((l) => l.trim() === 'ranking:' || l.trim().startsWith('ranking: '));
  if (start === -1) return [];
  const items = [];
  let cur = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^(?:[a-zA-Z_]+):/.test(line) && !line.startsWith('  ')) break; // next top-level key
    const m1 = /^\s+- rank:\s*(\d+)/.exec(line);
    const m2 = /^\s+competitorSlug:\s*"(.+)"/.exec(line);
    if (m1) {
      if (cur) items.push(cur);
      cur = { rank: parseInt(m1[1], 10), competitorSlug: null };
    } else if (m2 && cur) {
      cur.competitorSlug = m2[1];
    }
  }
  if (cur) items.push(cur);
  return items.filter((r) => r.competitorSlug);
}

const files = fs.readdirSync(LISTICLES_DIR).filter((f) => f.endsWith('.mdx'));
let changed = 0;
let unchanged = 0;

for (const f of files) {
  const full = path.join(LISTICLES_DIR, f);
  const raw = fs.readFileSync(full, 'utf8');
  const { fm, body } = split(raw);
  const ranking = extractRanking(fm);
  if (ranking.length === 0) {
    console.log(`  skip ${f} — no ranking found`);
    continue;
  }

  const polished = polishListicleBody({ body, ranking });
  const withImports = ensureImports(polished);
  if (withImports === body) {
    unchanged += 1;
    continue;
  }
  if (!dryRun) fs.writeFileSync(full, fm + '\n' + withImports, 'utf8');
  changed += 1;
  console.log(`  ${dryRun ? 'would-polish' : 'polished'} ${f}`);
}

console.log(`\nDone. Polished ${changed}, unchanged ${unchanged}, total ${files.length}.${dryRun ? ' (DRY RUN)' : ''}`);
