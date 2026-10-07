/**
 * A record without some keys.
 *
 * @param record the record
 * @param keys the keys to leave out
 */
export function withoutKeys<T>(
  record: Readonly<Record<string, T>>,
  keys: readonly string[],
): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)))
}
