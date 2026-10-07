/**
 * What the manifest hashes record for a file too large to read: its size, so a change in size still counts as a change.
 *
 * @param size the file's size in bytes
 */
export function oversizedHashOf(size: number): string {
  return `size:${size}`
}
