import { cleanTitle } from '../feed/text/clean-title.js'

/**
 * An HTML page's `<title>` as plain text, empty when it has none.
 *
 * @param html the page
 */
export function pageTitleOf(html: string): string {
  const title = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html.slice(0, 200_000))?.[1]

  return title === undefined ? '' : cleanTitle(title, true)
}
