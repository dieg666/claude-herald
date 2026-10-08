import type { Item } from '../../types/index.js'
import { fitToast } from './fit-toast.js'

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
    return fitToast(`1 new: ${first.title}`)
  }

  return fitToast(
    items.length === 2
      ? `2 new: ${first.title}, ${second.title}`
      : `${items.length} new: ${first.title} …`,
  )
}
