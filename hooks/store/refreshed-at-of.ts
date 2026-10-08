import { isRecord } from './is-record.js'

/**
 * The stored times of each source's last clean refresh by source id, dropping values that are not finite numbers.
 *
 * @param value what the store holds under `refreshedAt`
 */
export function refreshedAtOf(value: unknown): Record<string, number> {
  return Object.fromEntries(
    Object.entries(isRecord(value) ? value : {}).flatMap(([sourceId, at]) =>
      typeof at === 'number' && Number.isFinite(at) ? [[sourceId, at]] : [],
    ),
  )
}
