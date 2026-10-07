/**
 * What an item's id is derived from: a parsed feed entry or an extracted page item.
 */
export type ItemKey = {
  guid?: string
  id?: string
  link?: string
  url?: string
  title?: string
}
