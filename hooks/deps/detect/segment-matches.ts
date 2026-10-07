/**
 * Whether a directory name matches one pattern segment: `*` is any run of characters and `?` one character, the rest literal.
 *
 * @param name the directory's name
 * @param segment one segment of a member pattern (not `**`)
 */
export function segmentMatches(name: string, segment: string): boolean {
  const source = segment
    .split('')
    .map(char =>
      char === '*' ? '.*' : char === '?' ? '.' : char.replace(/[.+^${}()|[\]\\]/g, '\\$&'),
    )
    .join('')

  return new RegExp(`^${source}$`).test(name)
}
