/**
 * A stable 32-bit FNV-1a hash of a title, whitespace collapsed, as 8 hex digits.
 *
 * @param title the headline
 */
export function titleHashOf(title: string): string {
  const text = title.replace(/\s+/g, ' ').trim()
  let hash = 0x811c9dc5

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}
