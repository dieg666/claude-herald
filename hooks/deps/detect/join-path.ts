/**
 * An absolute path for a path relative to the root, in the root's own separator.
 *
 * @param root the project root, absolute
 * @param relative a `/`-separated path below it, `''` for the root itself
 */
export function joinPath(root: string, relative: string): string {
  if (relative === '') {
    return root
  }

  const separator = root.includes('\\') && !root.includes('/') ? '\\' : '/'
  const base = root.endsWith('/') || root.endsWith('\\') ? root : `${root}${separator}`

  return `${base}${relative.split('/').join(separator)}`
}
