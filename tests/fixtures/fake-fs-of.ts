import type { FsEntry } from 'claude-code'

import type { FakeFile } from './fake-file.js'

/**
 * The Host's file calls over an in-memory tree below `root`, recording every directory listed and file read (absolute paths); a read over 4 MiB rejects as the engine does.
 *
 * @param root the project root, absolute
 * @param tree the entries by path relative to the root; directories are implied by the paths
 * @param sessionRoot what the session's root answers, the project root by default
 */
export function fakeFsOf(
  root: string,
  tree: Readonly<Record<string, FakeFile>>,
  sessionRoot = root,
) {
  const dirs = new Map<string, Map<string, FsEntry>>([['', new Map()]])
  const files = new Map<string, { text: string; size: number }>()
  const lists: string[] = []
  const reads: string[] = []

  const dirAt = (path: string): Map<string, FsEntry> => {
    const known = dirs.get(path)

    if (known !== undefined) {
      return known
    }

    const created = new Map<string, FsEntry>()
    const cut = path.lastIndexOf('/')
    const parent = cut < 0 ? '' : path.slice(0, cut)

    dirs.set(path, created)
    dirAt(parent).set(path.slice(cut + 1), {
      name: path.slice(cut + 1),
      kind: 'dir',
      size: 0,
      mtimeMs: 0,
      isLink: false,
    })

    return created
  }

  for (const [path, entry] of Object.entries(tree)) {
    const cut = path.lastIndexOf('/')
    const parent = cut < 0 ? '' : path.slice(0, cut)
    const name = path.slice(cut + 1)

    if (typeof entry !== 'string' && entry.isDir === true) {
      dirAt(path)
    } else if (typeof entry !== 'string' && entry.isLink === true) {
      dirAt(parent).set(name, { name, kind: 'other', size: 0, mtimeMs: 0, isLink: true })
    } else {
      const text = typeof entry === 'string' ? entry : (entry.text ?? '')
      const size = typeof entry === 'string' ? text.length : (entry.size ?? text.length)

      files.set(path, { text, size })
      dirAt(parent).set(name, { name, kind: 'file', size, mtimeMs: 1, isLink: false })
    }
  }

  const relativeOf = (path: string): string | undefined =>
    path === root ? '' : path.startsWith(`${root}/`) ? path.slice(root.length + 1) : undefined

  return {
    lists,
    reads,
    /** Replaces a file's text and its listed size, as an edit on disk would. */
    write: (path: string, text: string, size = text.length) => {
      const cut = path.lastIndexOf('/')
      const name = path.slice(cut + 1)

      files.set(path, { text, size })
      dirs
        .get(cut < 0 ? '' : path.slice(0, cut))
        ?.set(name, { name, kind: 'file', size, mtimeMs: 2, isLink: false })
    },
    /** Removes a file and its listing, as a delete on disk would. */
    remove: (path: string) => {
      const cut = path.lastIndexOf('/')

      files.delete(path)
      dirs.get(cut < 0 ? '' : path.slice(0, cut))?.delete(path.slice(cut + 1))
    },
    sessionRoot: async () => sessionRoot,
    listDir: async (path: string): Promise<readonly FsEntry[]> => {
      lists.push(path)

      const listing = dirs.get(relativeOf(path) ?? '\u0000')

      if (listing === undefined) {
        throw new Error(`ENOENT: ${path}`)
      }

      return [...listing.values()].reverse()
    },
    readText: async (path: string): Promise<string> => {
      reads.push(path)

      const file = files.get(relativeOf(path) ?? '\u0000')

      if (file === undefined) {
        throw new Error(`ENOENT: ${path}`)
      }

      if (file.size > 4 * 1024 * 1024) {
        throw new Error(`EFBIG: ${path} is over 4 MiB`)
      }

      return file.text
    },
  }
}
