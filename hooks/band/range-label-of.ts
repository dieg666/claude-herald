import type { BandSpan } from './band-span.js'

/**
 * The header's position text: `1-3 of 12`, or `7 of 7` for a page of one.
 *
 * @param span the page shown
 * @param total how many items there are
 */
export function rangeLabelOf(span: BandSpan, total: number): string {
  const first = span.start + 1
  const last = span.start + span.count

  return `${last > first ? `${first}-${last}` : first} of ${total}`
}
