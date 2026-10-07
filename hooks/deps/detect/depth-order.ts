/**
 * Orders relative paths shallowest first, then by path: the order manifests are read in.
 *
 * @param a one path
 * @param b another
 */
export function depthOrder(a: string, b: string): number {
  const depth = (path: string) => path.split('/').length

  return depth(a) - depth(b) || (a < b ? -1 : a > b ? 1 : 0)
}
