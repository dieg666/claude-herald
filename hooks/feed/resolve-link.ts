/** A link as an absolute http(s) URL, resolved against `base` when relative; anything else is dropped. */
export function resolveLink(text: string | undefined, base?: string): string | undefined {
  const href = text?.trim() ?? ''

  if (href === '') {
    return undefined
  }

  const absolute = URL.canParse(href)
  const url = absolute
    ? new URL(href)
    : base !== undefined && URL.canParse(href, base)
      ? new URL(href, base)
      : undefined

  if (url?.protocol !== 'http:' && url?.protocol !== 'https:') {
    return undefined
  }

  return absolute ? href : url.href
}
