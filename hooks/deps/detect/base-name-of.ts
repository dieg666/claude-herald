/**
 * The file name of a relative path.
 *
 * @param path a `/`-separated path
 */
export function baseNameOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}
