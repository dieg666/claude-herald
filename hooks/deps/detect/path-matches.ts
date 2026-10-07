import { segmentMatches } from './segment-matches.js'

/**
 * Whether a relative directory path matches a member pattern, `**` matching any number of directories.
 *
 * @param path the directory's segments
 * @param pattern the pattern's segments
 */
export function pathMatches(path: readonly string[], pattern: readonly string[]): boolean {
  const [segment, ...rest] = pattern

  if (segment === undefined) {
    return path.length === 0
  }

  if (segment === '**') {
    return path.some((_, index) => pathMatches(path.slice(index), rest)) || pathMatches([], rest)
  }

  const [name, ...below] = path

  return name !== undefined && segmentMatches(name, segment) && pathMatches(below, rest)
}
