/**
 * An absolute http(s) address, or undefined for anything else.
 *
 * @param text what the person typed
 */
export function httpUrlOf(text: string): URL | undefined {
  try {
    const url = new URL(text.trim())

    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== ''
      ? url
      : undefined
  } catch {
    return undefined
  }
}
