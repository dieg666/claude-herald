import type { Item, Source } from '../../types/index.js'
import { displayTitleOf } from '../items/display-title-of.js'
import { fitToast } from './fit-toast.js'

/**
 * The one toast for a run's new items: `1 new: a`, `2 new: a, b`, `3 new: a …`, cut at a word to fit; a title that is only a version leads with its source's name; empty for none.
 *
 * @param items the new items, the one to name first
 * @param sources every source, for the names
 */
export function toastTextOf(items: readonly Item[], sources: readonly Source[] = []): string {
  const [first, second] = items

  if (first === undefined) {
    return ''
  }

  const shownOf = (item: Item) =>
    displayTitleOf(item.title, sources.find(source => source.id === item.sourceId)?.name)

  if (second === undefined) {
    return fitToast(`1 new: ${shownOf(first)}`)
  }

  return fitToast(
    items.length === 2
      ? `2 new: ${shownOf(first)}, ${shownOf(second)}`
      : `${items.length} new: ${shownOf(first)} …`,
  )
}
