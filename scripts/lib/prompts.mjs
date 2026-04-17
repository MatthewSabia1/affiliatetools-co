/**
 * Prompt builders for each content type.
 *
 * Strategy: the JS side owns all frontmatter (we generate valid YAML we fully
 * control). The model produces two artifacts per brief:
 *
 *   1. A JSON object with *data fields* that go into frontmatter
 *      (e.g. ranking[] for listicles, faq[] for all types).
 *   2. The MDX body prose.
 *
 * We split these with a hard `===BODY===` sentinel so they parse independently.
 * This is far more robust than asking the model to emit a whole strict-schema
 * MDX file in one shot.
 */

const COMPETITORS = [
  {
    slug: 'adrecon',
    name: 'AdRecon',
    tagline: "The affiliate marketer's Meta-only ad intelligence stack",
    price: '$299 / $599 lifetime (one-time, not subscription) as of April 2026',
    platforms: 'Meta (Facebook, Instagram, Threads)',
    strengths: 'Affiliate-network classification (ClickBank, Digistore24, BuyGoods, MaxWeb, WarriorPlus), Landing Page Ripper (downloads full LP HTML/CSS/assets as ZIP), Proven Creatives cross-advertiser grouping, Winning Offers Directory, days-running profitability signal',
    weaknesses: 'Meta-only — does NOT cover TikTok, YouTube, Google, LinkedIn, Pinterest. Newer tool (launched 2026). No AI/LLM features. No free tier (7-day money-back guarantee).',
    bestFor: 'Solo affiliate marketers running Meta campaigns on ClickBank, Digistore24, BuyGoods, MaxWeb, WarriorPlus',
  },
  {
    slug: 'adspy',
    name: 'AdSpy',
    tagline: 'The 10-year Meta ad archive with Boolean search',
    price: '$149/mo (recurring) as of April 2026',
    platforms: 'Meta (Facebook, Instagram) only',
    strengths: 'Boolean search operators (AND/OR/NOT), 10-year historical Meta database, established affiliate-community familiarity',
    weaknesses: 'No landing page archives. No affiliate-network classification. No free trial. UX is dated. $149/mo pricing stings vs lifetime alternatives.',
    bestFor: 'Boolean search power users who need deep Meta historical data',
  },
  {
    slug: 'bigspy',
    name: 'BigSpy',
    tagline: 'Multi-platform ad spy with a real free tier',
    price: 'Free · Basic $9/mo · Pro $99/mo · VIP Enterprise $249/mo as of April 2026',
    platforms: 'Meta, TikTok, Twitter/X, YouTube (shallow), Pinterest, Google Display',
    strengths: 'Real free tier (no credit card). Multi-platform coverage. Broad geographic reach. Lowest entry price in the category.',
    weaknesses: 'Shallow on each platform vs specialists. No affiliate-network classification. No landing page archiving. Free tier has hard limits.',
    bestFor: 'Beginners sampling the category; multi-platform generalists',
  },
  {
    slug: 'poweradspy',
    name: 'PowerAdSpy',
    tagline: 'Broadest multi-platform coverage, including Native',
    price: 'Basic $49/mo · Standard $99/mo · Professional $149/mo · Premium $249/mo as of April 2026',
    platforms: 'Facebook, Instagram, YouTube, Google Display, Native (Taboola, Outbrain, RevContent), Reddit, Quora, Pinterest, LinkedIn, TikTok',
    strengths: 'Widest platform coverage in the category — especially Native (Taboola/Outbrain). Good for campaigns spanning multiple ad surfaces.',
    weaknesses: 'Depth per platform is thinner than specialists. UX feels dated. No affiliate-network classification.',
    bestFor: 'Media buyers running Native ads (Taboola/Outbrain) alongside Meta',
  },
  {
    slug: 'foreplay',
    name: 'Foreplay',
    tagline: 'Creative research + brief workflow for agencies',
    price: 'Inspiration $49/mo · Strategist $99/mo · Agency $199/mo as of April 2026',
    platforms: 'Meta (Facebook, Instagram), TikTok',
    strengths: 'Best-in-category UX. Agency creative-brief workflow. Swipe files and mood boards. AI-assisted creative analysis.',
    weaknesses: 'No affiliate-network classification. No landing page archiving. Less historical depth than AdSpy.',
    bestFor: 'Creative agencies and strategists building mood boards and client deliverables',
  },
  {
    slug: 'minea',
    name: 'Minea',
    tagline: 'Multi-platform ad spy tuned for dropshipping',
    price: 'Starter €49/mo · Premium €99/mo · Business €399/mo as of April 2026',
    platforms: 'Meta, TikTok, Pinterest, influencer content',
    strengths: 'Product-first dropshipping workflow. Supplier research. Influencer integration. TikTok coverage.',
    weaknesses: 'Built for dropshipping/DTC, not CPA affiliate. No affiliate-network classification.',
    bestFor: 'Dropshippers and DTC e-commerce operators',
  },
  {
    slug: 'pipiads',
    name: 'PiPiADS',
    tagline: 'The TikTok ad specialist',
    price: 'Starter $77/mo · VIP $155/mo as of April 2026',
    platforms: 'TikTok primarily; some Meta',
    strengths: 'Deepest TikTok ad database in the category. TikTok Creative Center integration. Best for TikTok-first affiliates.',
    weaknesses: 'Weak on Meta. No affiliate-network classification. No landing page archiving.',
    bestFor: 'TikTok-first affiliate marketers and dropshippers',
  },
];

const COMPETITOR_SLUGS = COMPETITORS.map((c) => c.slug);

/** Compact competitor reference block fed into every prompt so slugs + facts stay consistent. */
function competitorsReference() {
  return COMPETITORS.map((c, i) =>
    `${i + 1}. slug="${c.slug}" — ${c.name}: ${c.tagline}\n` +
    `   price: ${c.price}\n` +
    `   platforms: ${c.platforms}\n` +
    `   strengths: ${c.strengths}\n` +
    `   weaknesses: ${c.weaknesses}\n` +
    `   best for: ${c.bestFor}`
  ).join('\n\n');
}

const EDITORIAL_RULES = `EDITORIAL RULES — obey these without exception:
- You are writing for AffiliateTools.co, an INDEPENDENT review site covering the affiliate-marketing software stack. Do NOT describe any operator or ownership relationship between this site and any of the tools reviewed. Do NOT say "we operate X," "our tool," "our team built X," "the operator behind this directory," "full disclosure: we own X," or any variation. Treat AdRecon as one of several tools reviewed — no more, no less.
- Do NOT insert disclosure paragraphs about conflicts of interest, operator relationships, or "we run this site." Those claims do not exist here.
- AdRecon may be recommended when the scoring rubric genuinely supports it (Meta affiliate research, Landing Page Ripper workflows, affiliate-network classification) — but always alongside honest admission of what it does NOT do (no TikTok, YouTube, Google, LinkedIn, or Pinterest coverage; no AI/LLM features; newer tool with smaller historical database than AdSpy; no free tier; premium pricing). Never over-stuff AdRecon into rankings where it doesn't genuinely fit.
- Write in the voice of a neutral senior operator-journalist — objective, specific, confident. Not a marketing copywriter. Not a fanboy.
- Suffix every price with "(as of April 2026)".
- Never invent user testimonials, review counts, or star ratings.
- Competitor marketing claims must be prefixed as claims, not facts ("AdSpy claims...", "BigSpy reports...").
- American English. Short paragraphs.`;

const COMPONENTS_HELP = `Available MDX components. Use them by name — do NOT write import statements, the pipeline injects those.
- <ToolLogo slug="SLUG" size="lg" showName /> — inline logo + name. Place immediately under each ranked tool's H3 heading. SLUG must match one of the competitor slugs.
- <Screenshot slug="SLUG" variant="hero" /> — captioned product screenshot. Use for the TOP 3 ranked tools, placed at the end of each of those tools' sections. Variant options: "hero", "dashboard", "pricing", "features".
- <CTA variant="mid" campaign="{slug}" medium="{type}" kicker="..." body="..." /> — AdRecon promotion block. Use exactly ONE per article, near the bottom before the FAQ.
- <FAQ items={frontmatter.faq} /> — renders the FAQ from frontmatter. Put at the very end of the body.`;

const BODY_SENTINEL = '===BODY===';

/**
 * Extract JSON block + body given a sentinel-delimited response.
 * Tolerates ```json fences and extra whitespace.
 */
export function parseModelResponse(raw) {
  const trimmed = raw.trim();
  const idx = trimmed.indexOf(BODY_SENTINEL);
  if (idx === -1) {
    throw new Error(`Missing ${BODY_SENTINEL} sentinel in model response`);
  }
  let jsonPart = trimmed.slice(0, idx).trim();
  const bodyPart = trimmed.slice(idx + BODY_SENTINEL.length).trim();

  // Strip ```json / ``` fences if present.
  jsonPart = jsonPart
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let data;
  try {
    data = JSON.parse(jsonPart);
  } catch (err) {
    // Try to recover by finding the first { and last } in the json part.
    const first = jsonPart.indexOf('{');
    const last = jsonPart.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      data = JSON.parse(jsonPart.slice(first, last + 1));
    } else {
      throw new Error(`JSON parse failed: ${err.message}\n--- jsonPart ---\n${jsonPart.slice(0, 600)}`);
    }
  }
  return { data, body: bodyPart };
}

export function buildListiclePrompt(brief) {
  return [
    {
      role: 'system',
      content: `You are a senior affiliate-marketing operator writing for AffiliateTools.co, an editorial directory of ad spy tools. You write with a calm, dated, operator-specific voice. You never sound like marketing copy.

${EDITORIAL_RULES}

CURRENT COMPETITORS ON THIS SITE (use these exact slugs in rankings):
${competitorsReference()}`,
    },
    {
      role: 'user',
      content: `Write a listicle for the slug "${brief.slug}".

Title: ${brief.title}
Target keyword: ${brief.targetKeyword}
Intent bucket: ${brief.intent}
Editorial angle: ${brief.angle}

Return TWO artifacts separated by a single "${BODY_SENTINEL}" line:

ARTIFACT 1 — JSON object with these keys:
{
  "description": "SEO meta description, 145-160 chars, no emoji",
  "methodologySummary": "1-2 sentence methodology note (we tested hands-on and scored across 8 weighted dimensions)",
  "ranking": [
    { "rank": 1, "competitorSlug": "<one of: ${COMPETITOR_SLUGS.join(', ')}>", "verdict": "one punchy sentence", "bestFor": "who this pick suits", "standoutFeature": "single differentiator", "priceNote": "price with '(as of April 2026)' suffix" }
    /* 5 to 7 items total, ranked by fit to the editorial angle */
  ],
  "faq": [
    { "q": "question", "a": "2-4 sentence answer" }
    /* exactly 5-7 items */
  ]
}

ARTIFACT 2 — MDX body (TARGET: 3000+ words of substantive, information-dense prose — this is the single most important instruction, longer is better) structured as:

  ## TL;DR
  (3-5 sentences — the clear picture of who should pick what, with the #1 pick called out with a specific dollar figure or differentiator)

  ## Why this ranking exists
  (2-3 paragraphs — the real user problem, market context, why the naive "most popular" answer is often wrong, why affiliate marketers specifically need the specificity called out in the angle)

  ## How we ranked
  (2 paragraphs naming the 8 weighted dimensions: coverage, dataFreshness, price, ux, landingPages, offers, affiliateFocus, search. Explain which dimensions were weighted highest for THIS angle and why. Disclose that AffiliateTools.co is operated by the AdRecon team.)

  ## The ranking

  ### 1. {{Tool Name}} — {{one-line verdict}}
  <ToolLogo slug="..." size="lg" showName />

  (Write 400-550 words covering: what it does best for THIS angle, two concrete workflow examples, one honest limitation, the pricing with "(as of April 2026)" suffix, and how it compares to the #2 pick. Cite specifics — feature names, filter options, platform support, dollar figures.)

  <Screenshot slug="..." variant="hero" />

  ### 2. {{Tool Name}} — {{verdict}}
  <ToolLogo slug="..." size="lg" showName />

  (400-550 words — same structure. Include <Screenshot slug="..." variant="hero" /> at end.)

  ### 3. {{Tool Name}} — {{verdict}}
  <ToolLogo slug="..." size="lg" showName />

  (400-550 words — same structure. Include <Screenshot slug="..." variant="hero" /> at end.)

  ### 4. {{Tool Name}} — {{verdict}}
  <ToolLogo slug="..." size="lg" showName />

  (300-400 words. Screenshot optional for ranks 4+.)

  ### 5. {{Tool Name}} — {{verdict}}
  <ToolLogo slug="..." size="lg" showName />

  (300-400 words.)

  [Continue for ranks 6-7 if present — 250-350 words each. Always include <ToolLogo slug="..." size="lg" showName /> at the top of each tool's section.]

  ## Pricing comparison
  (Table or structured prose comparing starting prices across all ranked tools with "(as of April 2026)" on every figure. Include the TCO math for AdRecon's lifetime pricing vs subscription competitors — over 1, 3, and 5 year horizons.)

  ## Who should pick what — by use case
  (6-8 specific personas with matching picks. Examples: "Solo ClickBank affiliate on Meta", "Agency creative strategist with 5+ clients", "First-time researcher on $0 budget", "Dropshipper testing TikTok Shorts". For each, name the recommended tool and the 2-sentence reason.)

  ## What we left off — and why
  (1-2 paragraphs acknowledging tools or categories that could have been included but were cut. This builds trust by showing the review is opinionated, not exhaustive-by-default.)

  <CTA variant="mid" campaign="${brief.slug}" medium="listicle" kicker="..." body="..." />

  ## Frequently asked questions

  <FAQ items={frontmatter.faq} />

${COMPONENTS_HELP}

HARD REQUIREMENTS:
- TARGET 3000+ WORDS of body prose. Depth over filler — specific feature names, dollar amounts, workflow steps, cite-able claims. No fluff paragraphs.
- Every ranked tool MUST have a <ToolLogo slug="..." size="lg" showName /> immediately after its H3 heading.
- The top 3 ranked tools MUST have a <Screenshot slug="..." variant="hero" /> at the end of their section.
- Do NOT claim any operator/ownership relationship between this site and AdRecon. Treat AdRecon as one reviewed tool among several.
- Every price followed by "(as of April 2026)".

Do not include YAML frontmatter in the body — we build that from ARTIFACT 1.
Do not wrap the JSON in markdown code fences.
Do not include anything before ARTIFACT 1 or after ARTIFACT 2.`,
    },
  ];
}

export function buildIntentPrompt(brief) {
  return [
    {
      role: 'system',
      content: `You are a senior affiliate-marketing operator writing a buyer-intent article for AffiliateTools.co. Buyer intent means the reader has a specific commercial question and is close to a decision. Answer it directly and honestly.

${EDITORIAL_RULES}

CURRENT COMPETITORS ON THIS SITE (use these exact slugs):
${competitorsReference()}`,
    },
    {
      role: 'user',
      content: `Write an intent article for the slug "${brief.slug}".

Title: ${brief.title}
Description: ${brief.description}
Intent kind: ${brief.intentKind}
Focused competitor: ${brief.competitorSlug}
Editorial angle: ${brief.angle}

Return TWO artifacts separated by a single "${BODY_SENTINEL}" line:

ARTIFACT 1 — JSON object with these keys:
{
  "description": "<reuse or lightly refine the provided description — 145-160 chars>",
  "faq": [
    { "q": "question", "a": "2-4 sentence answer" }
    /* exactly 5-7 items, each answering a real buyer sub-question */
  ]
}

ARTIFACT 2 — MDX body (TARGET: 3000+ words of substantive prose — longer is better) structured as:

  ## The short answer
  (3-5 sentences — direct answer to the intent question up front, with specifics. No hedging.)

  ## Context — what's actually being asked
  (2-3 paragraphs — the sub-intents inside the keyword, the user's likely situation, why the naive answer misses the mark.)

  ## The full breakdown

  [If this is an "alternatives" intent: list 5-6 specific alternatives as H3 sections, each with:
    ### Alternative Name
    <ToolLogo slug="..." size="lg" showName />
    (300-450 words of real comparison with pricing "(as of April 2026)", specific features, honest weaknesses.)
    <Screenshot slug="..." variant="hero" />  (include for top 3 alternatives)
  ]

  [If this is a "pricing" / "worth-it" / "free-trial" intent: cover the tool's tiers, the math, the comparison against 2-3 direct alternatives. Use H3 subsections:
    ### Starter tier
    ### Pro tier
    ### Enterprise tier
    ### How it compares
    <ToolLogo slug="${brief.competitorSlug || ''}" size="lg" showName /> for the focused tool.
  ]

  ## The honest answer for each buyer profile
  (Decision table in prose, 5-7 distinct user personas with specific picks. Each persona: 2-3 sentences.)

  ## Pricing math — total cost of ownership
  (Show the 1-year, 3-year, and 5-year TCO for the focused tool vs direct alternatives. Call out AdRecon's lifetime pricing advantage with concrete dollar differences.)

  ## Common mistakes buyers make
  (3-5 H3 sub-sections, each 100-200 words, on specific buying mistakes in this category.)

  ## When NOT to buy this tool
  (1-2 paragraphs on honest limitations and better alternatives for edge-case users.)

  <CTA variant="mid" campaign="intent-${brief.slug}" medium="intent" kicker="..." body="..." />

  ## Frequently asked questions

  <FAQ items={frontmatter.faq} />

${COMPONENTS_HELP}

HARD REQUIREMENTS:
- TARGET 3000+ WORDS of body prose.
- Every tool referenced in H3 subsections MUST have a <ToolLogo slug="..." size="lg" showName /> immediately after the heading.
- Top 3 tools compared MUST have a <Screenshot slug="..." variant="hero" />.
- Do NOT claim any operator/ownership relationship between this site and AdRecon.
- Every price followed by "(as of April 2026)".

Do not include YAML frontmatter. Do not wrap the JSON in code fences. Nothing before ARTIFACT 1 or after ARTIFACT 2.`,
    },
  ];
}

export function buildGuidePrompt(brief) {
  return [
    {
      role: 'system',
      content: `You are a senior affiliate-marketing operator writing an educational guide for AffiliateTools.co. Guides are tool-agnostic and build topical authority. Teach the reader a concrete workflow.

${EDITORIAL_RULES}

CURRENT COMPETITORS ON THIS SITE (use these exact slugs when you reference tools):
${competitorsReference()}`,
    },
    {
      role: 'user',
      content: `Write a guide for the slug "${brief.slug}".

Title: ${brief.title}
Description: ${brief.description}
Editorial angle: ${brief.angle}

Return TWO artifacts separated by a single "${BODY_SENTINEL}" line:

ARTIFACT 1 — JSON object with these keys:
{
  "description": "<reuse or lightly refine the provided description — 145-160 chars>",
  "heroEyebrow": "short eyebrow phrase (e.g. 'Research workflow', 'Buyer framework', 'Operator playbook')",
  "faq": [
    { "q": "question", "a": "2-4 sentence answer" }
    /* exactly 5-6 items */
  ]
}

ARTIFACT 2 — MDX body (TARGET: 3000+ words of substantive, workflow-detailed prose — longer is better) structured as:

  ## TL;DR
  (5-7 bullets — the real takeaways, not a summary of summaries)

  ## Why this matters
  (2-3 paragraphs — the problem this guide addresses, why naive approaches fail, what's at stake in dollars or hours.)

  ## Prerequisites and assumptions
  (1-2 paragraphs — what the reader should already know; what tools or access they need before starting.)

  ## The workflow / framework

  ### Step 1: {{Clear action verb}}
  (2-4 paragraphs with concrete detail: exact filter settings, specific dollar thresholds, real example inputs and outputs. Include at least one <ToolLogo slug="..." size="lg" showName /> reference if naming a specific tool.)

  ### Step 2: {{Clear action verb}}
  (2-4 paragraphs — same detail level.)

  ### Step 3: {{Clear action verb}}
  (2-4 paragraphs.)

  ### Step 4: {{Clear action verb}}
  (2-4 paragraphs.)

  ### Step 5: {{Clear action verb}}
  (2-4 paragraphs — if the workflow warrants it.)

  ## Worked example
  (A concrete run-through of the framework against a specific real-sounding scenario. 2-3 paragraphs with exact numbers and decisions.)

  ## Pitfalls to avoid
  (4-6 H3 sub-sections, each 100-200 words, on specific mistakes operators make in this workflow.)

  ## Which tools fit which step
  (A mapping of workflow steps to specific tools. Include <ToolLogo slug="..." size="lg" showName /> for each named tool. Be tool-agnostic but point out where AdRecon genuinely fits and where competitors are better. Include a <Screenshot slug="adrecon" variant="hero" /> OR <Screenshot slug="..." variant="hero" /> for whichever tool is most central to the workflow.)

  ## How to know the workflow is working
  (1-2 paragraphs — specific metrics/signals that tell you the workflow is paying off.)

  <CTA variant="mid" campaign="${brief.slug}" medium="guide" />

  ## Frequently asked questions

  <FAQ items={frontmatter.faq} />

${COMPONENTS_HELP}

HARD REQUIREMENTS:
- TARGET 3000+ WORDS of body prose.
- Every named tool (AdRecon, AdSpy, BigSpy, etc.) referenced as a specific product should include a <ToolLogo slug="..." size="lg" showName /> at first mention in an H3 section.
- Include at least ONE <Screenshot slug="..." variant="hero" /> somewhere in the guide (usually in "Which tools fit which step").
- Do NOT claim any operator/ownership relationship between this site and AdRecon.
- Every price followed by "(as of April 2026)".

Do not include YAML frontmatter. Do not wrap the JSON in code fences. Nothing before ARTIFACT 1 or after ARTIFACT 2.`,
    },
  ];
}

export { BODY_SENTINEL, COMPETITOR_SLUGS };
