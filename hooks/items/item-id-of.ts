import type { ItemKey } from './item-key.js'
import { titleHashOf } from './title-hash-of.js'

/**
 * An item's id, unique across sources: the source id, then the entry's guid, id, link or url (the first non-blank), else a hash of its title; undefined when all of them are blank.
 *
 * @param sourceId the source the entry came from
 * @param entry the entry's identifying fields
 */
export function itemIdOf(sourceId: string, entry: ItemKey): string | undefined {
  const key = [entry.guid, entry.id, entry.link, entry.url]
    .map(value => value?.trim() ?? '')
    .find(value => value !== '')

  if (key !== undefined) {
    return `${sourceId}:${key}`
  }

  const title = entry.title?.trim() ?? ''

  return title === '' ? undefined : `${sourceId}:title-${titleHashOf(title)}`
}
