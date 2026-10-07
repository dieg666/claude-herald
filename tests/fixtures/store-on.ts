import type { On } from 'claude-code'

/**
 * Answers `$.store` from a Map the test can read back, starting with those entries.
 *
 * @param on the test's registrar
 * @param entries what the store holds at the start
 */
export function storeOn(on: On, entries: Readonly<Record<string, unknown>> = {}) {
  const stored = new Map<string, unknown>(Object.entries(entries))

  on('store.get', ($, e) => ({ value: stored.get(e.key) }))

  on('store.set', ($, e) => {
    stored.set(e.key, e.value)

    return { value: undefined }
  })

  return stored
}
