import type { Item } from '../../types/index.js'
import { isLinkLabel } from './is-link-label.js'

/**
 * Whether an item carries text of its own: not blank and not only a link label.
 *
 * @param item the item
 */
export function hasText(item: Pick<Item, 'text'>): boolean {
  const text = item.text.trim()

  return text !== '' && !isLinkLabel(text)
}
