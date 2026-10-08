import type { BandSpan } from './band-span.js'

/**
 * The position text: `1-3 of 12`, or `7 of 7` for a page of one; the range's dash is a hyphen unless `dash` says otherwise.
 *
 * @param span the page shown
 * @param total how many items there are
 * @param dash what joins the first and last number of a range
 */
export function rangeLabelOf(span: BandSpan, total: number, dash = '-'): string {
  const first = span.start + 1
  const last = span.start + span.count

  return `${last > first ? `${first}${dash}${last}` : first} of ${total}`
}
