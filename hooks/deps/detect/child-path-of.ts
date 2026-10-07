/**
 * A relative path one level below a directory.
 *
 * @param dir a `/`-separated directory relative to the root, `''` for the root
 * @param name the entry's name
 */
export function childPathOf(dir: string, name: string): string {
  return dir === '' ? name : `${dir}/${name}`
}
