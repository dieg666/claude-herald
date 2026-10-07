import type { SavedItem } from '../../types/index.js'
import { isRecord } from './is-record.js'
import { itemOf } from './item-of.js'

/**
 * The stored saved list, dropping entries that are not a saved item; empty when it is not a list.
 *
 * @param value what the store holds under `saved`
 */
export function savedOf(value: unknown): SavedItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap(entry => {
    const item = itemOf(entry)
    const savedAt = isRecord(entry) ? entry.savedAt : undefined

    return item === undefined || typeof savedAt !== 'number' ? [] : [{ ...item, savedAt }]
  })
}
