/**
 * The trimmed text of the first child element by this name, or undefined.
 *
 * @param body an element's inner XML
 * @param name the child element
 */
export function xmlChildOf(body: string, name: string): string | undefined {
  const match = new RegExp(`<${name}\\b[^>]*>([^<]*)</${name}\\s*>`, 'i').exec(body)

  return match === null ? undefined : (match[1] ?? '').trim()
}
