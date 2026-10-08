/**
 * An address compared for sameness: scheme and host in lower case, no fragment, no trailing slash on the path, the query kept; undefined when it is not an absolute http(s) address.
 *
 * @param url the item's address
 */
export function normalizedUrlOf(url: string): string | undefined {
  const text = url.trim()

  if (!URL.canParse(text)) {
    return undefined
  }

  const parsed = new URL(text)

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return undefined
  }

  return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}${parsed.search}`
}
