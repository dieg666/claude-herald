import type { Item } from '../../types/index.js'
import { cutTo } from '../page/cut-to.js'
import { REFRESH_LIMITS } from './refresh-limits.js'

/**
 * The text cut at a word to fit the toast, an ellipsis marking the cut.
 *
 * @param text the whole toast
 */
function fitted(text: string): string {
  const max = REFRESH_LIMITS.toastChars

  if (text.length <= max) {
    return text
  }

  const cut = cutTo(text, max - 1)
  const space = cut.lastIndexOf(' ')

  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/**
 * The one toast for a run's new items: `1 new: a`, `2 new: a, b`, `3 new: a …`, cut at a word to fit; empty for none.
 *
 * @param items the new items, the one to name first
 */
export function toastTextOf(items: readonly Item[]): string {
  const [first, second] = items

  if (first === undefined) {
    return ''
  }

  if (second === undefined) {
    return fitted(`1 new: ${first.title}`)
  }

  return fitted(
    items.length === 2
      ? `2 new: ${first.title}, ${second.title}`
      : `${items.length} new: ${first.title} …`,
  )
}
