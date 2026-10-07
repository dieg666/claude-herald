/**
 * A link as an absolute http(s) address, resolved against the page's own address when relative.
 *
 * @param href the link as written, which may be relative or protocol-relative
 * @param pageUrl the address of the page the link was found on
 * @returns the address, or undefined for an empty, same-page (`#...`), non-http(s) or unresolvable link
 */
export const resolvePageUrl = (href: string, pageUrl: string) => {
  const trimmed = href.trim()

  if (trimmed === '' || trimmed.startsWith('#')) {
    return undefined
  }

  const url = URL.canParse(trimmed)
    ? new URL(trimmed)
    : URL.canParse(trimmed, pageUrl)
      ? new URL(trimmed, pageUrl)
      : undefined

  return url?.protocol === 'http:' || url?.protocol === 'https:' ? url.href : undefined
}
