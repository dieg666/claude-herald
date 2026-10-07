import { isRecord } from './is-record.js'

/**
 * The stored page content hashes by source id, dropping values that are not strings.
 *
 * @param value what the store holds under `pageHashes`
 */
export function pageHashesOf(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(isRecord(value) ? value : {}).flatMap(([sourceId, hash]) =>
      typeof hash === 'string' ? [[sourceId, hash]] : [],
    ),
  )
}
