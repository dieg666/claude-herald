import type { On } from 'claude-code'

/**
 * Answers `$.http.fetch` from pages by address (a string answers 200, an object its status), refusing any other address; records each address fetched.
 *
 * @param on the test's registrar
 * @param pages the web the test serves
 */
export function webOn(
  on: On,
  pages: ReadonlyMap<string, string | { status: number; text: string }>,
): string[] {
  const fetched: string[] = []

  on('http.fetch', ($, e) => {
    fetched.push(e.url)

    const page = pages.get(e.url)

    if (page === undefined) {
      return { deny: 'offline' }
    }

    const { status, text } = typeof page === 'string' ? { status: 200, text: page } : page

    return { value: { status, ok: status >= 200 && status < 300, headers: {}, text } }
  })

  return fetched
}
