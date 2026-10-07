import { childPathOf } from './child-path-of.js'
import { isSkippedDir } from './is-skipped-dir.js'
import type { Lister } from './lister.js'

/**
 * Walks the project breadth first and finds the files to read: links never followed, skipped directories never listed, at most `maxDepth` levels below the root.
 *
 * @param list the detection's Lister
 * @param keeps whether a file by this name is read
 * @param maxDepth how many directory levels below the root are listed
 * @returns each kept file's size by path relative to the root, in walk order
 */
export async function walkProject(
  list: Lister,
  keeps: (name: string) => boolean,
  maxDepth: number,
): Promise<Map<string, number>> {
  const files = new Map<string, number>()
  const queue: { dir: string; depth: number }[] = [{ dir: '', depth: 0 }]

  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    const entries = (await list(next.dir)) ?? []

    for (const entry of entries) {
      const path = childPathOf(next.dir, entry.name)

      if (entry.isLink) {
        continue
      }

      if (entry.kind === 'file' && keeps(entry.name)) {
        files.set(path, entry.size)
      } else if (entry.kind === 'dir' && next.depth < maxDepth && !isSkippedDir(entry.name)) {
        queue.push({ dir: path, depth: next.depth + 1 })
      }
    }
  }

  return files
}
