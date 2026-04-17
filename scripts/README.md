# Content pipeline

LLM-driven workflow that generates review + programmatic-SEO MDX content for
AffiliateTools.co via OpenRouter, polishes it to match the site's component
conventions, and runs gate checks before the file lands in `src/content/`.

## Quick start

```bash
# 1. Copy env template and add your OpenRouter key.
cp .env.example .env
# Edit .env:
#   OPENROUTER_API_KEY=sk-or-v1-...
#   OPENROUTER_MODEL=google/gemma-4-31b-it:free
#   OPENROUTER_FALLBACK_MODEL=google/gemma-3-27b-it:free

# 2. Run the default brief set (content-briefs.json).
npm run content:gen

# 3. Or run a custom brief set.
node scripts/generate-content.mjs --briefs=content-briefs-100.json --concurrency=4

# 4. Single brief (for prompt tuning / smoke tests).
node scripts/generate-content.mjs --only=best-ad-spy-tools-for-youtube

# 5. Overwrite existing files.
node scripts/generate-content.mjs --force

# 6. Dry-run (calls the API but does not write files).
node scripts/generate-content.mjs --dry-run
```

## Files

| Path | Role |
|---|---|
| `scripts/content-briefs.json` | Original 25-brief seed (hand-authored angles). |
| `scripts/content-briefs-100.json` | 100-brief batch (expanded via `build-100-briefs.mjs`). |
| `scripts/build-100-briefs.mjs` | Deterministic expander that assembles 100 briefs from vertical/platform/persona templates and dedupes against existing slugs. |
| `scripts/generate-content.mjs` | Main pipeline — reads briefs, calls OpenRouter, runs polish + review, writes MDX. |
| `scripts/polish-existing.mjs` | Retrofits existing listicle MDX with `<ToolLogo>` + `<Screenshot>` for every ranked tool. Idempotent. |
| `scripts/lib/openrouter.mjs` | Minimal OpenRouter client with primary + fallback model support. |
| `scripts/lib/prompts.mjs` | Prompt builders per content type + competitor reference block. |
| `scripts/lib/mdx.mjs` | Frontmatter builders, validators, polish + review helpers, and file writer. |

## How the pipeline works

Every brief passes through this sequence:

```
brief
  → prompt (prompts.mjs)
  → OpenRouter call (openrouter.mjs)
  → parse (JSON + ===BODY=== split, prompts.mjs)
  → validate schema (mdx.mjs validators — competitor slugs, FAQ count, ranking shape)
  → assemble frontmatter (mdx.mjs — we own this, not the model)
  → clean body (strip stray frontmatter + wrong imports, inject canonical preamble)
  → polish (inject missing <ToolLogo>/<Screenshot> per ranked tool)
  → review gate (wordCount >= 1600 + disclosure present + <CTA> present)
    ↳ retry with nudged temperature if review fails (max 3 attempts)
  → write to src/content/<type>/<slug>.mdx
```

The **frontmatter is built programmatically** — the model returns a JSON object
with the dynamic fields (`description`, `ranking[]`, `faq[]`, etc.) and we
assemble valid YAML on our side. This keeps schema conformance deterministic.

The **body is cleaned and polished**:
1. Any frontmatter block the model emitted is stripped.
2. Model-authored `import` lines are removed.
3. A canonical preamble is injected: `CTA`, `FAQ`, `ToolLogo`, `Screenshot`.
4. Listicles are polished deterministically — `<ToolLogo>` is added under each
   ranked `### N. Tool` H3 if missing; `<Screenshot>` is added at the end of
   the top-3 tools' sections if missing.

## Review gate

Before writing, every file is checked against three gates:

| Gate | Floor | Behavior on failure |
|---|---|---|
| Word count | 1600 words | Retry with higher temperature. After 3 attempts, publish with `warn` status. |
| Disclosure | "operated by AdRecon" (regex match) | Retry. After 3 attempts, publish with warning. |
| CTA present | `<CTA>` tag in body | Retry. After 3 attempts, publish with warning. |

Target word count is **3000+**. The 1600 floor is the hard gate; anything
above floor publishes clean. Summary logs average word count so prompt
regressions show up immediately.

## Writing a new brief

Append to `scripts/content-briefs.json` (or a custom brief file):

```json
{
  "type": "listicle",
  "slug": "best-ad-spy-tools-for-SOMETHING",
  "title": "Best Ad Spy Tools for SOMETHING (2026)",
  "targetKeyword": "best ad spy tools for SOMETHING",
  "intent": "long-tail",
  "angle": "Editorial angle — specifically what this listicle argues, where AdRecon honestly fits, and where it loses."
}
```

Supported types: `listicle`, `intent`, `guide`. See `content-briefs.json` for
shape per type. Slugs must be unique across all three content collections.

## CLI flags

| Flag | Effect |
|---|---|
| `--briefs=FILE` | Path to brief JSON (default `content-briefs.json`). |
| `--only=slug,slug` | Only generate the matching slugs. |
| `--limit=N` | Cap total briefs to N. |
| `--concurrency=N` | Parallel API calls (1-6, default 3). Free tier models rate-limit aggressively above 4-5. |
| `--force` | Overwrite existing files. Default is skip. |
| `--dry-run` | Call the API but do not write. |

## After generation

Generated files land in `src/content/`, which is the Astro content collection
directory. They become pages at next build:

```bash
npm run build
```

The static output in `dist/` deploys to Cloudflare Pages via `main` branch push
(see root README for deploy config). Commit + push is an explicit human
action — the pipeline never commits automatically.
