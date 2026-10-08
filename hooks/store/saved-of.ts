import type { SavedItem } from '../../types/index.js'
import { STACK_TAB } from '../names/stack-tab.js'
import { isRecord } from './is-record.js'
import { itemOf } from './item-of.js'
import { stackReleaseOf } from './stack-release-of.js'

/**
 * The stored saved list, dropping entries that are not a saved item, a stack item keeping its release; empty when it is not a list.
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
    const release =
      item?.sourceId === STACK_TAB && isRecord(entry) ? stackReleaseOf(entry.release) : undefined

    return item === undefined || typeof savedAt !== 'number'
      ? []
      : [{ ...item, savedAt, ...(release === undefined ? {} : { release }) }]
  })
}
