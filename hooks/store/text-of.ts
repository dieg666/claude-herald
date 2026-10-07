/**
 * A value as a string when it is one, else undefined.
 *
 * @param value anything read from the store
 */
export function textOf(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
