import { isRecord } from '../../store/is-record.js'

/**
 * A response body parsed as a JSON object, or undefined when it is not one.
 *
 * @param text the body
 */
export function jsonOf(text: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(text)

    return isRecord(value) ? value : undefined
  } catch {
    return undefined
  }
}
