#!/usr/bin/env node
/**
 * Generate scripts/content-briefs-100.json — 100 programmatic SEO briefs.
 *
 * Briefs are grouped into three content types:
 *   - listicle  (60) — vertical, platform, persona, and format angles
 *   - guide     (30) — workflow, buyer framework, and education angles
 *   - intent    (10) — alternatives pages + a few bottom-funnel angles
 *
 * Slugs that already exist on the site (or were produced by the first 25-piece
 * batch) are excluded from the output so we never duplicate.
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** Collect already-used slugs across all content collections. */
function existingSlugs() {
  const out = new Set();
  for (const dir of ['listicles', 'intent', 'guides']) {
    const full = path.join(ROOT, 'src/content', dir);
    if (!fs.existsSync(full)) continue;
    for (const f of fs.readdirSync(full)) {
      if (f.endsWith('.mdx')) out.add(f.replace(/\.mdx$/, ''));
    }
  }
  return out;
}
const used = existingSlugs();

/** ---------- LISTICLES (60) ---------- */
const listicles = [
  // Vertical / niche ranking angles (20)
  ['best-ad-spy-tools-for-insurance-offers', 'long-tail', "Insurance affiliate creatives are compliance-heavy — who captures active ads cleanly and who doesn't. AdRecon's network classifier doesn't cover insurance networks directly, so be honest about where it wins (Meta research) and where it doesn't."],
  ['best-ad-spy-tools-for-loan-offers', 'long-tail', "Personal loans, mortgages, auto refi — a regulated, high-CPM niche. Meta depth matters here. AdRecon covers the Meta side well."],
  ['best-ad-spy-tools-for-forex-offers', 'long-tail', "Forex/trading offers are among Meta's tightest compliance niches. Focus on dead-ad tracking — ads flash on and off. AdRecon's is_active flag helps."],
  ['best-ad-spy-tools-for-weight-loss-offers', 'long-tail', "Weight-loss/nutra is the single biggest ClickBank vertical. AdRecon's ClickBank tag + health niche classifier is a direct fit."],
  ['best-ad-spy-tools-for-dating-offers', 'long-tail', "Dating/sweeps-adjacent creatives. Meta, TikTok, native. Multi-platform angle — AdRecon is Meta-only."],
  ['best-ad-spy-tools-for-gambling-offers', 'long-tail', "iGaming/sportsbook creatives. Heavy compliance, geo-restricted. Multi-platform angle."],
  ['best-ad-spy-tools-for-mobile-gaming-offers', 'long-tail', "Mobile game CPI/CPA. TikTok and Meta focus. PiPiADS is strong here."],
  ['best-ad-spy-tools-for-travel-offers', 'long-tail', "Travel/cruise/destination affiliate offers. Largely seasonal. Meta is the primary channel."],
  ['best-ad-spy-tools-for-personal-development', 'long-tail', "PD/coaching/courses — ClickBank and Digistore territory. AdRecon's network classifier matches the workflow."],
  ['best-ad-spy-tools-for-survival-niche', 'long-tail', "Survival/prepper offers — a top ClickBank vertical with big winners. AdRecon's survival sub-niche tag fits."],
  ['best-ad-spy-tools-for-pets-niche', 'long-tail', "Pet products / DTC + affiliate. Meta creative depth, TikTok for virality."],
  ['best-ad-spy-tools-for-home-improvement', 'long-tail', "Home services / improvement / solar. Lead-gen heavy. AdRecon lead-gen angle."],
  ['best-ad-spy-tools-for-solar-offers', 'long-tail', "Solar lead-gen affiliate offers. Meta + native. High CPM niche."],
  ['best-ad-spy-tools-for-beauty-niche', 'long-tail', "Beauty/skincare creatives — DTC dominant, TikTok-first. Minea fits."],
  ['best-ad-spy-tools-for-fitness-offers', 'long-tail', "Fitness / body transformation / supplement. ClickBank / Meta. AdRecon match."],
  ['best-ad-spy-tools-for-fintech-offers', 'long-tail', "Fintech / neobank / credit cards. Compliance heavy. Multi-platform."],
  ['best-ad-spy-tools-for-credit-repair', 'long-tail', "Credit repair / debt-relief offers. Meta + native. AdRecon network tag wins."],
  ['best-ad-spy-tools-for-education-offers', 'long-tail', "EdTech / course affiliate. Meta + YouTube. AdRecon Meta side."],
  ['best-ad-spy-tools-for-solar-leadgen', 'long-tail', "Solar lead-gen specifically. Meta. Landing page archive value is high."],
  ['best-ad-spy-tools-for-saas-affiliates', 'long-tail', "SaaS affiliate programs — ConvertKit, ClickFunnels, etc. Meta + LinkedIn."],
  // Platform-specific (10)
  ['best-ad-spy-tools-for-reddit-ads', 'long-tail', "Reddit ad research. PowerAdSpy covers Reddit; most tools don't. Honest platform landscape."],
  ['best-ad-spy-tools-for-quora-ads', 'long-tail', "Quora ad research. PowerAdSpy covers Quora. AdRecon does not."],
  ['best-ad-spy-tools-for-snapchat-ads', 'long-tail', "Snapchat ad research. Almost no tool covers Snap well — say so plainly."],
  ['best-ad-spy-tools-for-x-twitter-ads', 'long-tail', "X/Twitter ad research. BigSpy covers Twitter shallowly."],
  ['best-ad-spy-tools-for-instagram-reels', 'long-tail', "Instagram Reels ads specifically. AdRecon covers Meta including Reels."],
  ['best-ad-spy-tools-for-threads-ads', 'long-tail', "Threads ads — new surface. AdRecon does cover Threads."],
  ['best-ad-spy-tools-for-meta-advantage-plus', 'long-tail', "Meta Advantage+ campaign research. Meta-only, recent."],
  ['best-ad-spy-tools-for-youtube-shorts', 'long-tail', "YouTube Shorts research. Short-form video angle."],
  ['best-ad-spy-tools-for-tiktok-shop', 'long-tail', "TikTok Shop specifically. PiPiADS + Minea cover this."],
  ['best-ad-spy-tools-for-instagram-reels-affiliates', 'long-tail', "Reels affiliate creatives — Meta research focus."],
  // Persona / role angles (10)
  ['best-ad-spy-tools-for-agencies-under-10-clients', 'long-tail', "Small agency tier — under 10 clients. Agency workflow + budget tier."],
  ['best-ad-spy-tools-for-affiliate-managers', 'long-tail', "Affiliate managers monitoring their network's offers. AdRecon Offers Directory fits."],
  ['best-ad-spy-tools-for-media-buyers-on-meta', 'long-tail', "Media buyers on Meta specifically. AdRecon + AdSpy comparison."],
  ['best-ad-spy-tools-for-solo-entrepreneurs', 'long-tail', "Solo operators with tight budgets. Lifetime pricing matters — AdRecon wins TCO."],
  ['best-ad-spy-tools-for-course-creators', 'long-tail', "Course creators studying competitor hooks. ClickBank focus."],
  ['best-ad-spy-tools-for-dtc-brands', 'long-tail', "DTC brand creative research. Minea + Foreplay strong; AdRecon weaker fit."],
  ['best-ad-spy-tools-for-performance-marketers', 'long-tail', "Performance marketers — days-running + cross-advertiser grouping. AdRecon wins."],
  ['best-ad-spy-tools-for-freelancers', 'long-tail', "Freelance media buyers. Portability, reasonable pricing. AdRecon lifetime."],
  ['best-ad-spy-tools-for-in-house-growth-teams', 'long-tail', "In-house growth teams at SaaS / DTC. Multi-user, agency-ish."],
  ['best-ad-spy-tools-for-copywriters', 'long-tail', "Copywriters studying winning hooks. Cross-advertiser creative grouping is key."],
  // Format / attribute angles (10)
  ['best-ad-spy-tools-with-api-access', 'bottom-funnel', "API access — rare in the category. Most tools don't expose one."],
  ['best-ad-spy-tools-with-team-seats', 'bottom-funnel', "Team-seat support. BigSpy Enterprise, Foreplay Agency. AdRecon Agency $599."],
  ['best-ad-spy-tools-with-landing-page-capture', 'bottom-funnel', "Landing-page capture capability — unique to AdRecon among reviewed tools. Honest survey of the (limited) alternatives."],
  ['best-ad-spy-tools-with-free-trials', 'bottom-funnel', "Free-trial availability. BigSpy has real free tier; AdSpy and AdRecon don't."],
  ['best-ad-spy-tools-with-lifetime-pricing', 'bottom-funnel', "Lifetime pricing — AdRecon is the standout. Alternatives compared honestly."],
  ['best-ad-spy-tools-with-affiliate-network-classification', 'bottom-funnel', "Affiliate-network auto-classification — AdRecon's defining feature. Only 1-2 others do any network tagging."],
  ['best-ad-spy-tools-with-dead-ad-tracking', 'bottom-funnel', "Dead-ad / is_active tracking. AdRecon surfaces it first-class; most don't."],
  ['best-ad-spy-tools-with-proof-tier-filtering', 'bottom-funnel', "Proof-tier creative filtering (15+/30+/60+/90+ linked ads). Unique to AdRecon."],
  ['best-ad-spy-tools-with-boolean-search', 'bottom-funnel', "Boolean search operators. AdSpy's historical strength."],
  ['best-ad-spy-tools-with-multi-country-geo', 'bottom-funnel', "Multi-country geo research. BigSpy's geographic breadth."],
  // Comparison / framing rankings (10)
  ['cheapest-ad-spy-tools-2026', 'head-term', "Cheapest tools — BigSpy free tier, Basic $9/mo. Lifetime angle: AdRecon wins long-run."],
  ['most-accurate-ad-spy-tools', 'head-term', "Data-accuracy angle — crawl depth, freshness, dead-ad tracking. Comparative."],
  ['most-advanced-ad-spy-tools', 'head-term', "Feature-depth angle — AI, LP capture, network classification, proof tiers."],
  ['best-ad-spy-tools-for-2026', 'head-term', "Generic 'best of 2026' — broad ranking, similar to existing flagship but new angle."],
  ['best-rated-ad-spy-tools', 'head-term', "Highest-scored tools across the 8 dimensions."],
  ['best-ad-spy-tools-for-small-business', 'head-term', "Small-business angle — pricing + ease."],
  ['best-ad-spy-tools-for-startups', 'head-term', "Startup growth angle — lean budgets, multi-platform."],
  ['best-ad-spy-tools-for-scaling-campaigns', 'head-term', "Scaling winning campaigns — depth + freshness matter most."],
  ['best-ad-spy-tools-replacement-for-facebook-ad-library', 'alternatives', "FB Ad Library is free but limited. Paid alternatives add network tagging, LP archives."],
  ['best-ad-spy-tools-alternative-to-adspy', 'alternatives', "AdSpy alternatives — overlap with existing adspy-alternatives listicle but different framing."],
];

/** ---------- GUIDES (30) ---------- */
const guides = [
  ['how-to-spy-on-tiktok-ads', "Step-by-step TikTok ad research. PiPiADS is the specialist. Include the free TikTok Creative Center as the $0 starting point."],
  ['how-to-reverse-engineer-a-competitor-funnel', "A complete workflow to take a competitor ad → landing page → offer → post-conversion experience. AdRecon Landing Page Ripper is the central tool."],
  ['how-to-find-winning-angles-on-clickbank', "Angle discovery on ClickBank — what separates a $50K/mo affiliate's angle from a beginner's. Pattern analysis across Proven Creatives."],
  ['how-to-research-affiliate-offers-before-launching', "Pre-launch offer research — how to know if an offer is worth testing. Signals: days running, creative volume, LP sophistication, network reputation."],
  ['how-to-build-a-facebook-ad-swipe-file', "Swipe-file construction — folder structure, tagging, notes. Foreplay's strength."],
  ['how-to-spot-winning-meta-creatives-in-2026', "What a 2026 winner looks like — format, pacing, hook, price anchor. Concrete heuristics."],
  ['how-to-find-profitable-affiliate-niches', "Niche discovery from ad-spy data. Signal: multi-advertiser offer aggregation in AdRecon's Winning Offers Directory."],
  ['how-to-use-facebook-ad-library-for-free-research', "Tactical guide to the free Meta Ad Library — filters, search, exports, limits. When free is enough."],
  ['how-to-track-competitor-ad-spend-estimates', "Estimating competitor spend from public data. Caveats: none of the tools publish real spend."],
  ['how-to-find-winning-landing-pages', "LP discovery workflow — from winning ad → LP → teardown. AdRecon LP Ripper + Wayback fallback."],
  ['how-to-research-warriorplus-offers', "WarriorPlus offer research — BizOpp-heavy niche. AdRecon's WP classifier."],
  ['how-to-research-maxweb-offers', "MaxWeb offer research — newer CPA network. AdRecon MaxWeb classifier."],
  ['how-to-build-a-meta-ad-research-workflow', "An end-to-end weekly workflow for Meta affiliate research. Time allocation + deliverables."],
  ['how-to-scale-a-winning-affiliate-creative', "From winning ad to scaled campaign — creative iteration, hook variations, audience refresh."],
  ['how-to-pick-an-affiliate-network', "Network-selection framework — CR, EPC, policies, offer mix. How ad spy tools help."],
  ['how-to-analyze-a-meta-ad-library-listing', "Reading a Meta Ad Library entry like a pro — fields, signals, what's missing."],
  ['how-to-identify-creative-fatigue-in-meta', "Creative fatigue detection — frequency, CTR decay, spend shifts. Signals in ad-spy data."],
  ['how-to-use-cross-advertiser-grouping-for-creative-ideas', "Cross-advertiser grouping — AdRecon's Proven Creatives — and how it feeds ideation."],
  ['how-to-research-tiktok-creators-before-partnerships', "Creator research + ad spy. Minea's influencer side."],
  ['how-to-find-viral-tiktok-product-ads', "Product-ad discovery on TikTok. Minea + PiPiADS."],
  ['how-to-build-a-client-ready-ad-report', "Agency deliverable — ad report for clients. Foreplay strength."],
  ['how-to-structure-a-creative-brief-from-ad-spy-data', "Brief-writing workflow grounded in ad-spy evidence. Foreplay brief builder."],
  ['how-to-spy-on-shopify-store-ads', "Shopify DTC ad research. Minea product-first workflow."],
  ['how-to-monitor-your-competitors-weekly', "A weekly competitor monitoring cadence. Tool setup + saved filters + email digests."],
  ['how-to-run-a-meta-compliance-pre-check', "Pre-launch compliance check using ad-spy data. Banned angles, rejected creatives."],
  ['how-to-use-days-running-as-a-profitability-signal', "Days-running as a signal — the 120-day heuristic, false positives, seasonal effects."],
  ['how-to-find-winning-hooks-from-ad-spy', "Hook-mining workflow. Pattern recognition across winners."],
  ['how-to-diversify-from-meta-to-other-platforms', "Diversification playbook — Meta → TikTok/Native/Google. Tool-by-platform mapping."],
  ['how-to-avoid-common-ad-spy-mistakes', "Top 10 mistakes operators make with ad spy data — false winners, outdated captures, geo bias."],
  ['affiliate-marketers-research-stack-2026', "The complete 2026 research stack — ad spy + LP capture + tracking + network dashboards. AdRecon as the central Meta piece."],
];

/** ---------- INTENT (10) ---------- */
const intent = [
  // competitorSlug required by schema for these.
  ['facebook-ad-library-alternatives', 'alternatives', null, 'Facebook Ad Library Alternatives: 7 Paid Tools That Do More', 'Paid alternatives to the free Meta Ad Library, with honest pros/cons and pricing math. AdRecon disclosed.'],
  ['adspy-vs-bigspy-which-should-i-buy', 'alternatives', 'adspy', 'AdSpy vs BigSpy: Which Should You Actually Buy in 2026?', 'Direct AdSpy vs BigSpy decision guide — pricing, features, workflow fit.'],
  ['is-adrecon-worth-it', 'worth-it', 'adrecon', 'Is AdRecon Worth $299? An Honest Buyer Decision Framework', 'From the AdRecon team directly: when $299 lifetime is worth it, and when it genuinely is not. Meta-only scope, no AI features, newer tool caveats acknowledged.'],
  ['cheap-adspy-alternatives', 'alternatives', 'adspy', 'Cheap AdSpy Alternatives: 6 Tools Under $100/Month (2026)', 'Budget alternatives to AdSpy — BigSpy, AdRecon lifetime, Foreplay Inspiration tier.'],
  ['free-ad-spy-tools-that-actually-work', 'alternatives', null, 'Free Ad Spy Tools That Actually Work: The Honest List (2026)', 'What works at $0 — BigSpy free, Meta Ad Library, TikTok Creative Center. And when free stops being enough.'],
  ['adrecon-vs-facebook-ad-library', 'alternatives', 'adrecon', 'AdRecon vs Facebook Ad Library: When Free Is Enough', 'Honest comparison: the free Meta Ad Library vs AdRecon. Disclosure-first, since we operate AdRecon.'],
  ['pipiads-vs-minea-for-tiktok', 'alternatives', 'pipiads', 'PiPiADS vs Minea for TikTok Ad Research (2026)', 'PiPiADS is TikTok-specialist; Minea is TikTok + e-commerce. Which one fits which workflow.'],
  ['foreplay-vs-adspy-for-agencies', 'alternatives', 'foreplay', 'Foreplay vs AdSpy for Agencies: Which Actually Fits an Agency Workflow?', 'Agency-first comparison. Foreplay briefs + swipe files vs AdSpy raw search.'],
  ['bigspy-vs-adrecon-for-starters', 'alternatives', 'bigspy', 'BigSpy vs AdRecon for New Affiliates: Free Start vs Lifetime Buy', 'The first-tool decision. BigSpy free tier vs AdRecon $299 lifetime.'],
  ['minea-vs-pipiads-for-dropshipping', 'alternatives', 'minea', 'Minea vs PiPiADS for Dropshipping: Which Wins in 2026?', 'Dropshipping-specific comparison. Minea is product-first; PiPiADS is TikTok-first.'],
];

/** ---------- Assemble ---------- */
const briefs = [];

for (const [slug, intentType, angle] of listicles) {
  if (used.has(slug)) continue;
  const titleBase = slug
    .replace(/^best-ad-spy-tools-/, 'Best Ad Spy Tools ')
    .replace(/^best-/, 'Best ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bAd\b/g, 'Ad')
    .replace(/\bSaas\b/g, 'SaaS');
  briefs.push({
    type: 'listicle',
    slug,
    title: `${titleBase} (2026)`,
    targetKeyword: slug.replace(/-/g, ' '),
    intent: intentType,
    angle,
  });
}

for (const [slug, angle] of guides) {
  if (used.has(slug)) continue;
  const titleBase = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bClickbank\b/g, 'ClickBank')
    .replace(/\bTiktok\b/g, 'TikTok')
    .replace(/\bDtc\b/g, 'DTC')
    .replace(/\bSaas\b/g, 'SaaS');
  briefs.push({
    type: 'guide',
    slug,
    title: titleBase,
    description: angle.split('.').slice(0, 2).join('.') + '.',
    angle,
  });
}

for (const [slug, kind, competitorSlug, title, description] of intent) {
  if (used.has(slug)) continue;
  briefs.push({
    type: 'intent',
    slug,
    intentKind: kind,
    competitorSlug,
    title,
    description,
    angle: description,
  });
}

// Cap at 100.
const final = briefs.slice(0, 100);

const output = {
  notes: `100 programmatic-SEO briefs. ${final.filter((b) => b.type === 'listicle').length} listicles, ${final.filter((b) => b.type === 'guide').length} guides, ${final.filter((b) => b.type === 'intent').length} intent pages. Generated ${new Date().toISOString()}.`,
  briefs: final,
};

const outPath = path.join(__dirname, 'content-briefs-100.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
console.log(`Wrote ${final.length} briefs to ${path.relative(ROOT, outPath)}`);
console.log(`Split: listicles=${final.filter((b) => b.type === 'listicle').length}, guides=${final.filter((b) => b.type === 'guide').length}, intent=${final.filter((b) => b.type === 'intent').length}`);
