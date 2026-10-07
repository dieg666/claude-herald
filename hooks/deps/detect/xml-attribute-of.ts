/**
 * An attribute's value in an element's attribute text, case-insensitively by name.
 *
 * @param attributes the text between the tag name and `>`
 * @param name the attribute
 */
export function xmlAttributeOf(attributes: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(attributes)

  return match === null ? undefined : (match[1] ?? match[2] ?? '').trim()
}
