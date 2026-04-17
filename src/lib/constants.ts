/**
 * Site-wide constants for AffiliateTools.co.
 * Single source of truth for URLs, competitor slugs, and CTA builders.
 */

export const SITE_URL = 'https://affiliatetools.co';
export const SITE_NAME = 'AffiliateTools.co';
export const SITE_TAGLINE = 'Independent reviews of ad spy tools and affiliate marketing software.';
export const SITE_DESCRIPTION =
  'Honest, research-backed reviews of ad spy tools, landing page platforms, affiliate networks, and the software affiliate marketers actually use.';

/** AdRecon (operator of this site) — CTA destination. */
export const ADRECON_HOME_URL = 'https://adrecon.io';
export const ADRECON_APP_URL = 'https://adrecon.io/app/';

/** AdRecon scale claim (user-confirmed 2026-04-17). */
export const ADRECON_SCALE = '300,000+ ads, creatives, landing pages, and offers';
export const ADRECON_SCALE_SHORT = '300K+ records';

/** Competitor slugs (order matters for UI lists). */
export const COMPETITOR_SLUGS = [
  'adrecon',
  'adspy',
  'bigspy',
  'poweradspy',
  'foreplay',
  'minea',
  'pipiads',
] as const;

export type CompetitorSlug = (typeof COMPETITOR_SLUGS)[number];

/** Non-AdRecon competitor slugs (used to generate versus pages). */
export const VERSUS_SLUGS: CompetitorSlug[] = [
  'adspy',
  'bigspy',
  'poweradspy',
  'foreplay',
  'minea',
  'pipiads',
];

/** Listicle slug registry. */
export const LISTICLE_SLUGS = [
  'best-ad-spy-tools-2026',
  'best-ad-spy-tools-for-affiliate-marketers',
  'best-ad-spy-tools-for-facebook-ads',
  'adspy-alternatives',
  'best-free-ad-spy-tools',
  'best-ad-spy-tools-for-clickbank',
] as const;

export type ListicleSlug = (typeof LISTICLE_SLUGS)[number];

/** Pretty-print competitor names (fallback if yaml doesn't load). */
export const COMPETITOR_NAMES: Record<CompetitorSlug, string> = {
  adrecon: 'AdRecon',
  adspy: 'AdSpy',
  bigspy: 'BigSpy',
  poweradspy: 'PowerAdSpy',
  foreplay: 'Foreplay',
  minea: 'Minea',
  pipiads: 'PiPiADS',
};

/** Build a UTM-tagged URL pointing at AdRecon app. */
export function buildAdreconCta(opts: {
  medium: 'hub' | 'review' | 'versus' | 'listicle' | 'footer' | 'home' | 'about' | 'methodology';
  campaign: string;
  content?: string;
}): string {
  const u = new URL(ADRECON_APP_URL);
  u.searchParams.set('utm_source', 'affiliatetools.co');
  u.searchParams.set('utm_medium', opts.medium);
  u.searchParams.set('utm_campaign', opts.campaign);
  if (opts.content) u.searchParams.set('utm_content', opts.content);
  return u.toString();
}

/** Absolute URL helper for canonicals + sitemap refs. */
export function absoluteUrl(pathname: string): string {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  return `${SITE_URL}${withSlash}`;
}

/** Dated claim suffix for pricing/feature facts (so content ages honestly). */
export const DATA_AS_OF = 'April 2026';

/** Route helpers. */
export const routes = {
  home: () => '/',
  about: () => '/about/',
  methodology: () => '/methodology/',
  contact: () => '/contact/',
  hub: () => '/ad-spy-tools/',
  review: (slug: CompetitorSlug) => `/ad-spy-tools/${slug}-review/`,
  versus: (slug: CompetitorSlug) => `/ad-spy-tools/adrecon-vs-${slug}/`,
  listicle: (slug: ListicleSlug) => `/ad-spy-tools/${slug}/`,
};
