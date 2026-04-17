import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { CompetitorSlug } from './constants';
import { COMPETITOR_SLUGS } from './constants';

export type CompetitorEntry = CollectionEntry<'competitors'>;
export type ReviewEntry = CollectionEntry<'reviews'>;
export type VersusEntry = CollectionEntry<'versus'>;
export type ListicleEntry = CollectionEntry<'listicles'>;

export async function getCompetitor(slug: CompetitorSlug): Promise<CompetitorEntry> {
  const entry = await getEntry('competitors', slug);
  if (!entry) throw new Error(`Missing competitor data: ${slug}`);
  return entry;
}

export async function getAllCompetitors(): Promise<CompetitorEntry[]> {
  return getCollection('competitors');
}

export async function getCompetitorsInDisplayOrder(): Promise<CompetitorEntry[]> {
  const all = await getAllCompetitors();
  const bySlug = new Map(all.map((c) => [c.data.slug, c]));
  return COMPETITOR_SLUGS.map((s) => bySlug.get(s)).filter((c): c is CompetitorEntry => Boolean(c));
}

export async function getReviewFor(competitorSlug: CompetitorSlug): Promise<ReviewEntry | undefined> {
  const all = await getCollection('reviews');
  return all.find((r) => r.data.competitorSlug === competitorSlug && !r.data.draft);
}

export async function getAllReviews(): Promise<ReviewEntry[]> {
  const all = await getCollection('reviews');
  return all.filter((r) => !r.data.draft);
}

export async function getVersusFor(competitorSlug: Exclude<CompetitorSlug, 'adrecon'>): Promise<VersusEntry | undefined> {
  const all = await getCollection('versus');
  return all.find((v) => v.data.competitorSlug === competitorSlug && !v.data.draft);
}

export async function getAllVersus(): Promise<VersusEntry[]> {
  const all = await getCollection('versus');
  return all.filter((v) => !v.data.draft);
}

export async function getListicle(slug: string): Promise<ListicleEntry | undefined> {
  const all = await getCollection('listicles');
  return all.find((l) => l.slug === slug && !l.data.draft);
}

export async function getAllListicles(): Promise<ListicleEntry[]> {
  const all = await getCollection('listicles');
  return all.filter((l) => !l.data.draft).sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Score averaging for display. */
export function overallScore(scores: CompetitorEntry['data']['scores']): number {
  const values = Object.values(scores);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

/** Tailwind class for score severity. */
export function scoreSeverity(score: number): 'low' | 'med' | 'high' {
  if (score < 5) return 'low';
  if (score < 7.5) return 'med';
  return 'high';
}
