import type { Item } from '../../types/index.js'

/**
 * Items of a source numbered from 1, newest first, an hour apart starting `startHour` hours before 2026-01-02.
 *
 * @param sourceId the source's id
 * @param count how many
 * @param startHour hours before 2026-01-02 of the first, newest one
 */
export function datedItemsOf(sourceId: string, count: number, startHour = 0): Item[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${sourceId}:${index + 1}`,
    sourceId,
    title: `${sourceId} ${index + 1}`,
    url: `https://example.com/${sourceId}/${index + 1}`,
    publishedAt: new Date(Date.UTC(2026, 0, 2) - (startHour + index) * 3_600_000).toISOString(),
    text: `The full story about ${sourceId} ${index + 1}, with enough detail to summarize`,
  }))
}
