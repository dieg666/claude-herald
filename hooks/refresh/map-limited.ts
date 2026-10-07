/**
 * Maps every value with at most `limit` calls in flight at once, results in input order.
 *
 * @param values what to map
 * @param limit the most calls in flight, at least 1
 * @param fn the mapping, which should not reject
 */
export async function mapLimited<T, R>(
  values: readonly T[],
  limit: number,
  fn: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let next = 0

  const work = async () => {
    while (next < values.length) {
      const index = next

      next += 1
      results[index] = await fn(values[index] as T)
    }
  }

  const workers = Math.min(values.length, Math.max(1, Math.floor(limit)))

  await Promise.all(Array.from({ length: workers }, work))

  return results
}
