import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export async function GET(context: APIContext) {
  const reviews = await getCollection('reviews', ({ data }) => !data.draft);
  const versus = await getCollection('versus', ({ data }) => !data.draft);
  const listicles = await getCollection('listicles', ({ data }) => !data.draft);

  const items = [
    ...reviews.map((r) => ({
      title: r.data.title,
      description: r.data.description,
      pubDate: new Date(r.data.publishDate),
      link: `${SITE_URL}/ad-spy-tools/${r.data.competitorSlug}-review/`,
      categories: ['Review'],
    })),
    ...versus.map((v) => ({
      title: v.data.title,
      description: v.data.description,
      pubDate: new Date(v.data.publishDate),
      link: `${SITE_URL}/ad-spy-tools/${v.slug}/`,
      categories: ['Comparison'],
    })),
    ...listicles.map((l) => ({
      title: l.data.title,
      description: l.data.description,
      pubDate: new Date(l.data.publishDate),
      link: `${SITE_URL}/ad-spy-tools/${l.slug}/`,
      categories: ['Ranking'],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: `${SITE_NAME} — Honest reviews of ad spy tools`,
    description: 'Independent, hands-on reviews and comparisons of ad spy tools for affiliate marketers.',
    site: context.site ?? SITE_URL,
    items,
    customData: `<language>en-us</language>`,
  });
}
