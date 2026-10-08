import type { BandSpan } from '../band/band-span.js'

/**
 * The pane's position text, an en dash between the ends: `1–14 of 14`, or `7 of 7` for a window of one.
 *
 * @param span the window shown
 * @param total how many items there are
 */
export function paneRangeOf(span: BandSpan, total: number): string {
  const first = span.start + 1
  const last = span.start + span.count

  return `${last > first ? `${first}–${last}` : first} of ${total}`
}
