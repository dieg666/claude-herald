import { isRecord } from '../../store/is-record.js'

/**
 * The object under a path of keys, or an empty object when any step is missing or not an object.
 *
 * @param value where to start
 * @param keys the keys to follow
 */
export function recordAt(value: unknown, ...keys: readonly string[]): Record<string, unknown> {
  let current = value

  for (const key of keys) {
    current = isRecord(current) && Object.hasOwn(current, key) ? current[key] : undefined
  }

  return isRecord(current) ? current : {}
}
