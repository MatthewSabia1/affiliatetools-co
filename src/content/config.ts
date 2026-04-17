import { defineCollection, z } from 'astro:content';

/* -------------------- competitors (data) -------------------- */
const pricingTier = z.object({
  name: z.string(),
  monthly: z.number().nullable(),
  annual: z.number().nullable().optional(),
  billing: z.enum(['monthly', 'annual', 'one-time', 'custom']).default('monthly'),
  seatsIncluded: z.number().optional(),
  highlight: z.string().optional(),
  features: z.array(z.string()).default([]),
});

const screenshot = z.object({
  path: z.string(), // relative to /public
  caption: z.string(),
  alt: z.string(),
  sourceUrl: z.string().url().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const score = z.number().min(1).max(10);

const competitorsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    tagline: z.string(),
    foundedYear: z.number().optional(),
    homepageUrl: z.string().url(),
    pricingUrl: z.string().url().optional(),
    logo: z.object({
      path: z.string(),
      invertInLight: z.boolean().default(false),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
    brandColor: z.string().default('#888888'),

    platforms: z.array(z.string()),                // ['Meta (Facebook, Instagram)', 'TikTok', ...]
    primaryUseCases: z.array(z.string()),          // ['Affiliate research', 'Dropshipping', ...]

    pricing: z.object({
      startingMonthly: z.number().nullable(),
      currency: z.enum(['USD', 'EUR', 'GBP']).default('USD'),
      priceAsOf: z.string(),                       // ISO date YYYY-MM-DD
      freeTier: z.boolean().default(false),
      freeTrial: z
        .object({
          days: z.number(),
          creditCardRequired: z.boolean().default(false),
          notes: z.string().optional(),
        })
        .nullable()
        .default(null),
      tiers: z.array(pricingTier),
      refundPolicy: z.string().optional(),
      notes: z.string().optional(),
    }),

    coverage: z.object({
      platforms: z.array(z.string()),
      claimedAdCount: z.string().nullable().default(null),  // phrase exactly as competitor claims
      geoCount: z.number().nullable().optional(),
      historyDepth: z.string().nullable().optional(),       // "2015-present"
      updateCadence: z.string().nullable().optional(),      // "daily", "hourly", "real-time"
    }),

    // 1–10 scorecard, AdRecon's editorial opinion
    scores: z.object({
      coverage: score,                  // platform + ad breadth
      dataFreshness: score,             // update cadence, deduplication
      price: score,                     // value per dollar
      ux: score,                        // UI quality + learning curve
      landingPages: score,              // LP research capabilities
      offers: score,                    // affiliate-offer intelligence
      affiliateFocus: score,            // how well it fits affiliate marketers
      search: score,                    // search + filters
    }),

    strengths: z.array(z.string()).min(3),
    weaknesses: z.array(z.string()).min(3),

    bestFor: z.array(z.string()).min(1),
    notFor: z.array(z.string()).min(1),

    standoutFeature: z.string(),        // one-liner: single most notable thing

    screenshots: z.array(screenshot).default([]),

    // External reputation (only if verified + sourced)
    externalRatings: z
      .array(
        z.object({
          source: z.string(),           // "G2", "Capterra", "Product Hunt"
          rating: z.number().nullable(),
          outOf: z.number().default(5),
          reviewCount: z.number().nullable().optional(),
          url: z.string().url(),
          asOf: z.string(),             // YYYY-MM-DD
        }),
      )
      .default([]),

    // Meta for lists / cards
    cardBlurb: z.string(),              // ~160 chars for card grids
  }),
});

/* -------------------- reviews (content MDX) -------------------- */
const reviewsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    competitorSlug: z.string(),
    title: z.string(),
    description: z.string(),
    headline: z.string().optional(),
    publishDate: z.string(),             // YYYY-MM-DD
    updatedDate: z.string(),
    heroEyebrow: z.string().optional(),
    verdict: z.string(),                 // 1-sentence takeaway
    overallScore: z.number().min(1).max(10),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        }),
      )
      .min(5),
    draft: z.boolean().default(false),
  }),
});

/* -------------------- versus (content MDX) -------------------- */
const versusCollection = defineCollection({
  type: 'content',
  schema: z.object({
    competitorSlug: z.string(),          // the non-AdRecon side
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    updatedDate: z.string(),
    tldr: z.object({
      chooseAdrecon: z.string(),         // one sentence
      chooseCompetitor: z.string(),
    }),
    focusAxes: z.array(z.string()).min(3), // e.g. ['price', 'coverage', 'affiliateFocus']
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        }),
      )
      .min(5),
    draft: z.boolean().default(false),
  }),
});

/* -------------------- listicles (content MDX) -------------------- */
const listiclesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    targetKeyword: z.string(),
    publishDate: z.string(),
    updatedDate: z.string(),
    intent: z.enum(['head-term', 'bottom-funnel', 'long-tail', 'alternatives']),
    methodologySummary: z.string(),       // 1-2 sentences (full methodology in MDX body)
    ranking: z
      .array(
        z.object({
          rank: z.number(),
          competitorSlug: z.string(),
          verdict: z.string(),            // 1-sentence takeaway
          bestFor: z.string(),
          standoutFeature: z.string(),
          priceNote: z.string(),
        }),
      )
      .min(5),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        }),
      )
      .min(5),
    draft: z.boolean().default(false),
  }),
});

/* -------------------- intent (content MDX) -------------------- */
const intentCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    competitorSlug: z.string().optional(),
    intentKind: z.enum(['worth-it', 'pricing', 'free-trial', 'alternatives']),
    publishDate: z.string(),
    updatedDate: z.string(),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
  }),
});

/* -------------------- guides (content MDX) -------------------- */
const guidesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    updatedDate: z.string(),
    heroEyebrow: z.string().optional(),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        }),
      )
      .default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  competitors: competitorsCollection,
  reviews: reviewsCollection,
  versus: versusCollection,
  listicles: listiclesCollection,
  intent: intentCollection,
  guides: guidesCollection,
};
