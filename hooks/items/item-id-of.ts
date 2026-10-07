import type { ItemKey } from './item-key.js'
import { titleHashOf } from './title-hash-of.js'

/**
 * An item's id, unique across sources: the source id, then the entry's guid, id, link or url (the first non-blank), else a hash of its title.
 *
 * @param sourceId the source the entry came from
 * @param entry the entry's identifying fields
 */
export function itemIdOf(sourceId: string, entry: ItemKey): string {
  const key = [entry.guid, entry.id, entry.link, entry.url]
    .map(value => value?.trim() ?? '')
    .find(value => value !== '')

  return `${sourceId}:${key ?? `title-${titleHashOf(entry.title ?? '')}`}`
}
