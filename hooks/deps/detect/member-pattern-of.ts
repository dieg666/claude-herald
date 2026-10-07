/**
 * A workspace member pattern as path segments relative to the workspace, or undefined when it is absolute or climbs out with `..`.
 *
 * @param pattern the pattern as the manifest writes it
 */
export function memberPatternOf(pattern: string): string[] | undefined {
  const path = pattern.trim().replace(/\\/g, '/')

  if (path === '' || path.startsWith('/') || /^[A-Za-z]:/.test(path) || path.startsWith('~')) {
    return undefined
  }

  const segments = path.split('/').filter(segment => segment !== '' && segment !== '.')

  return segments.includes('..') ? undefined : segments
}
