/**
 * Where a raw-text element (script, style, textarea, title) ends, or the end of the markup if it never closes.
 *
 * @param html the markup
 * @param from the index just past the start tag
 * @param name the element name in lower case
 * @returns the index to resume reading from
 */
export const rawTextEnd = (html: string, from: number, name: string) => {
  const closer = new RegExp(`</${name}(?![^\\s/>])`, 'gi')

  closer.lastIndex = from

  const found = closer.exec(html)

  if (found === null) {
    return html.length
  }

  const close = html.indexOf('>', found.index + found[0].length)

  return close === -1 ? html.length : close + 1
}
