/**
 * JSON-LD (schema.org) builders.
 * Each function returns a plain object; BaseLayout serializes with JSON.stringify.
 */

import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, ADRECON_HOME_URL, absoluteUrl } from './constants';

type Scalar = string | number | boolean | null;
type JsonLdValue = Scalar | JsonLdValue[] | { [k: string]: JsonLdValue };
export type JsonLd = Record<string, JsonLdValue>;

/** AffiliateTools.co publisher Organization block. */
export const ORG_PUBLISHER: JsonLd = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  foundingDate: '2026',
  parentOrganization: {
    '@type': 'Organization',
    name: 'AdRecon',
    url: ADRECON_HOME_URL,
  },
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/favicon.svg`,
  },
};

export function breadcrumbList(items: Array<{ name: string; path: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPage(faq: Array<{ q: string; a: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

export type SoftwareAppInput = {
  name: string;
  description: string;
  url: string;
  screenshot?: string;
  startingPrice?: number | null;
  currency?: 'USD' | 'EUR' | 'GBP';
  featureList?: string[];
  aggregateRating?: { ratingValue: number; bestRating?: number; ratingCount?: number };
};

export function softwareApplication(input: SoftwareAppInput): JsonLd {
  const sw: JsonLd = {
    '@type': 'SoftwareApplication',
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
  };
  if (input.screenshot) sw.screenshot = input.screenshot;
  if (input.featureList && input.featureList.length) sw.featureList = input.featureList;
  if (typeof input.startingPrice === 'number') {
    sw.offers = {
      '@type': 'Offer',
      price: String(input.startingPrice),
      priceCurrency: input.currency || 'USD',
      url: input.url,
    };
  }
  return sw;
}

export function reviewJsonLd(input: {
  pageUrl: string;
  reviewedName: string;
  reviewedDescription: string;
  reviewedUrl: string;
  reviewedScreenshot?: string;
  reviewedFeatures?: string[];
  reviewedPrice?: number | null;
  reviewedCurrency?: 'USD' | 'EUR' | 'GBP';
  rating: number;               // 1–10
  reviewBody: string;
  datePublished: string;        // YYYY-MM-DD
  dateModified: string;
  headline: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    name: input.headline,
    headline: input.headline,
    reviewBody: input.reviewBody,
    url: input.pageUrl,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: {
      '@type': 'Organization',
      name: 'AdRecon Research',
      url: ADRECON_HOME_URL,
    },
    publisher: ORG_PUBLISHER,
    itemReviewed: softwareApplication({
      name: input.reviewedName,
      description: input.reviewedDescription,
      url: input.reviewedUrl,
      screenshot: input.reviewedScreenshot,
      featureList: input.reviewedFeatures,
      startingPrice: input.reviewedPrice,
      currency: input.reviewedCurrency,
    }),
    reviewRating: {
      '@type': 'Rating',
      ratingValue: input.rating,
      bestRating: 10,
      worstRating: 1,
    },
  };
}

export function articleJsonLd(input: {
  pageUrl: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  image?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    url: input.pageUrl,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    author: {
      '@type': 'Organization',
      name: 'AdRecon Research',
      url: ADRECON_HOME_URL,
    },
    publisher: ORG_PUBLISHER,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.pageUrl },
    ...(input.image ? { image: input.image } : {}),
  };
}

export function itemListJsonLd(input: {
  items: Array<{
    position: number;
    name: string;
    description: string;
    url: string;
    startingPrice?: number | null;
    currency?: 'USD' | 'EUR' | 'GBP';
    features?: string[];
  }>;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListOrder: 'Ascending',
    numberOfItems: input.items.length,
    itemListElement: input.items.map((it) => ({
      '@type': 'ListItem',
      position: it.position,
      item: softwareApplication({
        name: it.name,
        description: it.description,
        url: it.url,
        featureList: it.features,
        startingPrice: it.startingPrice,
        currency: it.currency,
      }),
    })),
  };
}

export function collectionPageJsonLd(input: {
  pageUrl: string;
  name: string;
  description: string;
  hasPart: Array<{ url: string; name: string; description: string }>;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    url: input.pageUrl,
    description: input.description,
    publisher: ORG_PUBLISHER,
    hasPart: input.hasPart.map((p) => ({
      '@type': 'WebPage',
      url: p.url,
      name: p.name,
      description: p.description,
    })),
  };
}

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    ...ORG_PUBLISHER,
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: ORG_PUBLISHER,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}
