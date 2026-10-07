/**
 * What two addresses of the same feed share: host and path without the scheme, trailing slashes or fragment; the trimmed text, lowercased, when it does not parse.
 *
 * @param text an address
 */
export function urlKeyOf(text: string): string {
  try {
    const url = new URL(text.trim())
    const path = url.pathname.replace(/\/+$/, '')

    return `${url.host}${path}${url.search}`
  } catch {
    return text.trim().toLowerCase()
  }
}
