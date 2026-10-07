/**
 * The directory of a relative path, `''` for a file at the root.
 *
 * @param path a `/`-separated path relative to the root
 */
export function dirOf(path: string): string {
  const cut = path.lastIndexOf('/')

  return cut < 0 ? '' : path.slice(0, cut)
}
