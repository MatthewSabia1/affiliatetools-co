/**
 * Internal link graph for AffiliateTools.co.
 * Powers "related links" sections across reviews, versus pages, and listicles.
 *
 * Design: each page links to 3–5 contextually relevant sibling pages.
 * Anchor text rotates (min 4 variants per destination).
 */

import type { CompetitorSlug, ListicleSlug } from './constants';
import { routes } from './constants';

export type RelatedLink = {
  href: string;
  label: string;
  kind: 'review' | 'versus' | 'listicle' | 'hub' | 'external';
  blurb?: string;
};

/** For review pages — which siblings + listicles to feature. */
export const REVIEW_RELATED: Record<CompetitorSlug, Array<{ slug?: CompetitorSlug; listicle?: ListicleSlug }>> = {
  adrecon: [
    { slug: 'adspy' },
    { slug: 'foreplay' },
    { slug: 'bigspy' },
    { listicle: 'best-ad-spy-tools-for-affiliate-marketers' },
    { listicle: 'best-ad-spy-tools-for-clickbank' },
  ],
  adspy: [
    { slug: 'adrecon' },
    { slug: 'bigspy' },
    { slug: 'poweradspy' },
    { listicle: 'adspy-alternatives' },
    { listicle: 'best-ad-spy-tools-for-affiliate-marketers' },
  ],
  bigspy: [
    { slug: 'adrecon' },
    { slug: 'adspy' },
    { slug: 'poweradspy' },
    { listicle: 'best-free-ad-spy-tools' },
    { listicle: 'best-ad-spy-tools-2026' },
  ],
  poweradspy: [
    { slug: 'bigspy' },
    { slug: 'adspy' },
    { slug: 'adrecon' },
    { listicle: 'best-ad-spy-tools-2026' },
    { listicle: 'adspy-alternatives' },
  ],
  foreplay: [
    { slug: 'adrecon' },
    { slug: 'minea' },
    { slug: 'adspy' },
    { listicle: 'best-ad-spy-tools-2026' },
    { listicle: 'best-ad-spy-tools-for-affiliate-marketers' },
  ],
  minea: [
    { slug: 'adrecon' },
    { slug: 'foreplay' },
    { slug: 'pipiads' },
    { listicle: 'best-ad-spy-tools-2026' },
    { listicle: 'best-ad-spy-tools-for-facebook-ads' },
  ],
  pipiads: [
    { slug: 'minea' },
    { slug: 'adrecon' },
    { slug: 'bigspy' },
    { listicle: 'best-ad-spy-tools-2026' },
    { listicle: 'best-ad-spy-tools-for-affiliate-marketers' },
  ],
};

/** For versus pages — which sibling versus + listicles to feature. */
export const VERSUS_RELATED: Record<Exclude<CompetitorSlug, 'adrecon'>, Array<{ slug?: CompetitorSlug; listicle?: ListicleSlug }>> = {
  adspy: [
    { slug: 'bigspy' },
    { slug: 'foreplay' },
    { listicle: 'adspy-alternatives' },
    { listicle: 'best-ad-spy-tools-for-affiliate-marketers' },
  ],
  bigspy: [
    { slug: 'adspy' },
    { slug: 'poweradspy' },
    { listicle: 'best-free-ad-spy-tools' },
    { listicle: 'best-ad-spy-tools-2026' },
  ],
  poweradspy: [
    { slug: 'bigspy' },
    { slug: 'adspy' },
    { listicle: 'best-ad-spy-tools-2026' },
    { listicle: 'adspy-alternatives' },
  ],
  foreplay: [
    { slug: 'adspy' },
    { slug: 'minea' },
    { listicle: 'best-ad-spy-tools-for-facebook-ads' },
    { listicle: 'best-ad-spy-tools-for-affiliate-marketers' },
  ],
  minea: [
    { slug: 'foreplay' },
    { slug: 'pipiads' },
    { listicle: 'best-ad-spy-tools-2026' },
    { listicle: 'best-ad-spy-tools-for-facebook-ads' },
  ],
  pipiads: [
    { slug: 'minea' },
    { slug: 'bigspy' },
    { listicle: 'best-ad-spy-tools-2026' },
    { listicle: 'best-ad-spy-tools-for-affiliate-marketers' },
  ],
};

/** For listicle pages — 2 sibling listicles to feature. */
export const LISTICLE_RELATED: Record<ListicleSlug, ListicleSlug[]> = {
  'best-ad-spy-tools-2026': [
    'best-ad-spy-tools-for-affiliate-marketers',
    'best-ad-spy-tools-for-facebook-ads',
  ],
  'best-ad-spy-tools-for-affiliate-marketers': [
    'best-ad-spy-tools-for-clickbank',
    'best-ad-spy-tools-2026',
  ],
  'best-ad-spy-tools-for-facebook-ads': [
    'best-ad-spy-tools-2026',
    'adspy-alternatives',
  ],
  'adspy-alternatives': [
    'best-ad-spy-tools-for-affiliate-marketers',
    'best-ad-spy-tools-2026',
  ],
  'best-free-ad-spy-tools': [
    'best-ad-spy-tools-2026',
    'best-ad-spy-tools-for-affiliate-marketers',
  ],
  'best-ad-spy-tools-for-clickbank': [
    'best-ad-spy-tools-for-affiliate-marketers',
    'adspy-alternatives',
  ],
};

/** Anchor-text variants per destination — rotate to avoid over-optimization. */
const REVIEW_ANCHORS: Record<CompetitorSlug, string[]> = {
  adrecon: ['our full AdRecon review', 'the AdRecon review', 'AdRecon (detailed review)', 'read our AdRecon breakdown'],
  adspy: ['our AdSpy review', 'the full AdSpy breakdown', 'AdSpy (detailed review)', 'read our AdSpy evaluation'],
  bigspy: ['our BigSpy review', 'the BigSpy breakdown', 'BigSpy (full review)', 'read our BigSpy evaluation'],
  poweradspy: ['our PowerAdSpy review', 'the PowerAdSpy breakdown', 'PowerAdSpy (detailed review)', 'read our PowerAdSpy evaluation'],
  foreplay: ['our Foreplay review', 'the Foreplay breakdown', 'Foreplay (full review)', 'read our Foreplay evaluation'],
  minea: ['our Minea review', 'the Minea breakdown', 'Minea (detailed review)', 'read our Minea evaluation'],
  pipiads: ['our PiPiADS review', 'the PiPiADS breakdown', 'PiPiADS (full review)', 'read our PiPiADS evaluation'],
};

const VERSUS_ANCHORS: Record<Exclude<CompetitorSlug, 'adrecon'>, string[]> = {
  adspy: ['AdRecon vs AdSpy', 'our AdRecon vs AdSpy comparison', 'how AdRecon stacks up against AdSpy', 'AdRecon vs AdSpy head-to-head'],
  bigspy: ['AdRecon vs BigSpy', 'our AdRecon vs BigSpy comparison', 'the AdRecon vs BigSpy head-to-head', 'AdRecon compared to BigSpy'],
  poweradspy: ['AdRecon vs PowerAdSpy', 'our AdRecon vs PowerAdSpy comparison', 'AdRecon compared to PowerAdSpy', 'the head-to-head on PowerAdSpy'],
  foreplay: ['AdRecon vs Foreplay', 'our AdRecon vs Foreplay comparison', 'AdRecon compared to Foreplay', 'the Foreplay head-to-head'],
  minea: ['AdRecon vs Minea', 'our AdRecon vs Minea comparison', 'AdRecon compared to Minea', 'the Minea head-to-head'],
  pipiads: ['AdRecon vs PiPiADS', 'our AdRecon vs PiPiADS comparison', 'AdRecon compared to PiPiADS', 'PiPiADS vs AdRecon — the full comparison'],
};

const LISTICLE_ANCHORS: Record<ListicleSlug, string[]> = {
  'best-ad-spy-tools-2026': ['best ad spy tools of 2026', 'our ranked list of the best ad spy tools', '2026\u2019s top-rated ad spy tools', 'the full best-of ranking'],
  'best-ad-spy-tools-for-affiliate-marketers': ['best ad spy tools for affiliate marketers', 'the affiliate marketer\u2019s picks', 'affiliate-focused ad spy ranking', 'our affiliate-marketer shortlist'],
  'best-ad-spy-tools-for-facebook-ads': ['best ad spy tools for Facebook ads', 'Facebook-focused ad spy picks', 'our Facebook ad spy ranking', 'top tools for Meta ad research'],
  'adspy-alternatives': ['AdSpy alternatives', 'alternatives to AdSpy', 'the best AdSpy alternatives', 'our AdSpy alternative shortlist'],
  'best-free-ad-spy-tools': ['best free ad spy tools', 'free ad spy tool ranking', 'top no-cost ad spy options', 'our free-tier shortlist'],
  'best-ad-spy-tools-for-clickbank': ['best ad spy tools for ClickBank', 'ClickBank-focused ad spy picks', 'our ClickBank shortlist', 'top tools for ClickBank affiliate research'],
};

/**
 * Deterministically pick an anchor variant for a destination,
 * seeded by the source page slug so anchors stay stable but varied.
 */
function pickAnchor(variants: string[], sourceSeed: string): string {
  let sum = 0;
  for (let i = 0; i < sourceSeed.length; i++) sum = (sum + sourceSeed.charCodeAt(i)) % 1024;
  return variants[sum % variants.length];
}

export function getReviewRelated(slug: CompetitorSlug): RelatedLink[] {
  const refs = REVIEW_RELATED[slug] || [];
  const out: RelatedLink[] = [];
  for (const ref of refs) {
    if (ref.slug) {
      out.push({
        href: routes.review(ref.slug),
        label: pickAnchor(REVIEW_ANCHORS[ref.slug], slug),
        kind: 'review',
      });
    } else if (ref.listicle) {
      out.push({
        href: routes.listicle(ref.listicle),
        label: pickAnchor(LISTICLE_ANCHORS[ref.listicle], slug),
        kind: 'listicle',
      });
    }
  }
  if (slug !== 'adrecon') {
    out.unshift({
      href: routes.versus(slug),
      label: pickAnchor(VERSUS_ANCHORS[slug as Exclude<CompetitorSlug, 'adrecon'>], `review-${slug}`),
      kind: 'versus',
    });
  }
  return out;
}

export function getVersusRelated(slug: Exclude<CompetitorSlug, 'adrecon'>): RelatedLink[] {
  const refs = VERSUS_RELATED[slug] || [];
  const out: RelatedLink[] = [];
  out.push({
    href: routes.review(slug),
    label: pickAnchor(REVIEW_ANCHORS[slug], `versus-${slug}`),
    kind: 'review',
  });
  out.push({
    href: routes.review('adrecon'),
    label: pickAnchor(REVIEW_ANCHORS.adrecon, `versus-${slug}`),
    kind: 'review',
  });
  for (const ref of refs) {
    if (ref.slug && ref.slug !== 'adrecon') {
      out.push({
        href: routes.versus(ref.slug),
        label: pickAnchor(VERSUS_ANCHORS[ref.slug as Exclude<CompetitorSlug, 'adrecon'>], `versus-${slug}`),
        kind: 'versus',
      });
    } else if (ref.listicle) {
      out.push({
        href: routes.listicle(ref.listicle),
        label: pickAnchor(LISTICLE_ANCHORS[ref.listicle], `versus-${slug}`),
        kind: 'listicle',
      });
    }
  }
  return out;
}

export function getListicleRelated(slug: ListicleSlug): RelatedLink[] {
  const siblings = LISTICLE_RELATED[slug] || [];
  return siblings.map((s) => ({
    href: routes.listicle(s),
    label: pickAnchor(LISTICLE_ANCHORS[s], `listicle-${slug}`),
    kind: 'listicle',
  }));
}
