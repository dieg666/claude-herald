/**
 * The time a dated entry sorts by, newest first; undated or unparsable ones sort last.
 *
 * @param publishedAt the entry's ISO 8601 date
 */
export function timeOf(publishedAt: string | undefined): number {
  const time = publishedAt === undefined ? Number.NaN : Date.parse(publishedAt)

  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}
