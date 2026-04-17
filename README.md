# AffiliateTools.co

Independent review hub for ad spy tools and affiliate-marketer software. Operated by the [AdRecon](https://adrecon.io) team.

## Stack

- [Astro 5](https://astro.build) static site
- [Tailwind CSS 4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- [MDX](https://mdxjs.com) for long-form content
- [Cloudflare Pages](https://pages.cloudflare.com) hosting (static output)

## Local development

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
npm run preview    # http://localhost:4322
npm run check      # astro check (type-check)
npm run lint:links # linkinator on dist/
```

## Deploy

Cloudflare Pages auto-deploys on push to `main` (preview deploys on pull requests).

Manual deploy via Wrangler:

```bash
npx wrangler pages deploy dist --project-name=affiliatetools-co
```

## Structure

```
src/
  content/          # Zod-validated content collections
    competitors/    # YAML facts per tool
    reviews/        # MDX review pages
    versus/         # MDX head-to-head pages
    listicles/      # MDX ranked listicle pages
  pages/            # Astro file-based routing
  layouts/          # Page-type layouts
  components/       # Reusable Astro components
  lib/              # Helpers: constants, schema builders, cross-link graph
  styles/           # Global Tailwind + tokens
public/
  logos/            # Real competitor logos
  screenshots/      # Real product screenshots
  og/               # Per-page OG images
```

## Editorial policy

AffiliateTools.co is operated by the AdRecon team. AdRecon is a competitor to most tools reviewed here. We disclose this openly on every page and publish our [methodology](/methodology/) so readers can judge our objectivity.

### Integrity rules

- Every review states ≥1 thing the competitor does better than AdRecon
- Every price is followed by "(as of [date])"
- Never claim features AdRecon does not have (no "AI," no multi-platform)
- Competitor marketing claims always prefixed with the source
- No fabricated testimonials, ratings, or user quotes
