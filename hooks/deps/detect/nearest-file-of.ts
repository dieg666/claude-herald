import { childPathOf } from './child-path-of.js'
import { dirOf } from './dir-of.js'

/**
 * The closest file by one of these names in a directory or above it, up to the root; the lockfile a manifest uses.
 *
 * @param texts the files read, by relative path
 * @param dir where to start, relative to the root
 * @param names the file names, in order of preference within one directory
 */
export function nearestFileOf(
  texts: ReadonlyMap<string, string>,
  dir: string,
  names: readonly string[],
): string | undefined {
  let current = dir

  for (;;) {
    const found = names.map(name => childPathOf(current, name)).find(path => texts.has(path))

    if (found !== undefined || current === '') {
      return found
    }

    current = dirOf(current)
  }
}
