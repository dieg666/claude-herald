import { isRecord } from './is-record.js'

/**
 * The stored seen ids by source id, dropping anything that is not a list of strings.
 *
 * @param value what the store holds under `seen`
 */
export function seenOf(value: unknown): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(isRecord(value) ? value : {}).flatMap(([sourceId, ids]) =>
      Array.isArray(ids)
        ? [[sourceId, ids.filter((id): id is string => typeof id === 'string')]]
        : [],
    ),
  )
}
