/**
 * The strings of a list, dropping anything else; empty when it is not a list.
 *
 * @param value a parsed value
 */
export function stringsOf(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}
