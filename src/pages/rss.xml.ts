import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

const parseDate = (value: string) =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);

export async function GET(context: APIContext) {
  const reviews = await getCollection("reviews", ({ data }) => !data.draft);
  const versus = await getCollection("versus", ({ data }) => !data.draft);
  const listicles = await getCollection("listicles", ({ data }) => !data.draft);
  const guides = await getCollection("guides", ({ data }) => !data.draft);
  const intents = await getCollection("intent", ({ data }) => !data.draft);

  const items = [
    ...reviews.map((r) => ({
      title: r.data.title,
      description: r.data.description,
      pubDate: parseDate(r.data.publishDate),
      link: `${SITE_URL}/ad-spy-tools/${r.data.competitorSlug}-review/`,
      categories: ["Review"],
    })),
    ...versus.map((v) => ({
      title: v.data.title,
      description: v.data.description,
      pubDate: parseDate(v.data.publishDate),
      link: `${SITE_URL}/ad-spy-tools/${v.slug}/`,
      categories: ["Comparison"],
    })),
    ...listicles.map((l) => ({
      title: l.data.title,
      description: l.data.description,
      pubDate: parseDate(l.data.publishDate),
      link: `${SITE_URL}/ad-spy-tools/${l.slug}/`,
      categories: ["Ranking"],
    })),
    ...guides.map((g) => ({
      title: g.data.title,
      description: g.data.description,
      pubDate: parseDate(g.data.publishDate),
      link: `${SITE_URL}/guides/${g.slug}/`,
      categories: ["Guide"],
    })),
    ...intents.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: parseDate(entry.data.publishDate),
      link: `${SITE_URL}/ad-spy-tools/${entry.slug}/`,
      categories: ["Buyer Guide"],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: `${SITE_NAME} — Honest reviews of ad spy tools`,
    description:
      "Independent, hands-on reviews and comparisons of ad spy tools for affiliate marketers.",
    site: context.site ?? SITE_URL,
    items,
    customData: `<language>en-us</language>`,
  });
}
