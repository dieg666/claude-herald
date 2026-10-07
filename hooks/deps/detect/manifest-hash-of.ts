/**
 * A content hash of a file: its length and two 32-bit FNV-1a passes, enough to notice a change.
 *
 * @param text the file's text
 */
export function manifestHashOf(text: string): string {
  let forward = 0x811c9dc5
  let backward = 0x811c9dc5

  for (let index = 0; index < text.length; index += 1) {
    forward = Math.imul(forward ^ text.charCodeAt(index), 0x01000193)
    backward = Math.imul(backward ^ text.charCodeAt(text.length - 1 - index), 0x01000193)
  }

  const hex = (value: number) => (value >>> 0).toString(16).padStart(8, '0')

  return `${text.length.toString(16)}-${hex(forward)}${hex(backward)}`
}
