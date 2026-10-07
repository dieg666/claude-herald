import { isRecord } from './is-record.js'

/**
 * The stored project records by root path, as stored (each read through `depsProjectOf`); empty when the value is not an object.
 *
 * @param value what the store holds under `deps`
 */
export function depsProjectsOf(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}
