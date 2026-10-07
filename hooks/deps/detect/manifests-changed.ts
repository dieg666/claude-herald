import type { Host } from '../../host/host.js'
import { loadDepsProject } from '../../store/load-deps-project.js'
import { baseNameOf } from './base-name-of.js'
import { dirOf } from './dir-of.js'
import { joinPath } from './join-path.js'
import { manifestHashOf } from './manifest-hash-of.js'
import { oversizedHashOf } from './oversized-hash-of.js'

/**
 * The hash a recorded file has now: its size for one recorded as too large to read, else its content hash; undefined when it is gone.
 *
 * @param host the engine
 * @param root the project root, absolute
 * @param path the file, relative to the root
 * @param recorded the hash the last detection recorded
 */
async function currentHashOf(
  host: Host,
  root: string,
  path: string,
  recorded: string,
): Promise<string | undefined> {
  if (/^size:\d+$/.test(recorded)) {
    const entries = await host.listDir(joinPath(root, dirOf(path))).catch(() => undefined)
    const entry = entries?.find(each => each.name === baseNameOf(path) && each.kind === 'file')

    return entry === undefined ? undefined : oversizedHashOf(entry.size)
  }

  const text = await host.readText(joinPath(root, path)).catch(() => undefined)

  return text === undefined ? undefined : manifestHashOf(text)
}

/**
 * Whether any manifest or lockfile the last detection read has changed or gone, by content hash (by size for a file too large to read); false for a project with nothing recorded. Only re-reads the recorded files, so a manifest added in a new place waits for the next session start or rescan.
 *
 * @param host the engine
 * @param root the project root, absolute
 */
export async function manifestsChanged(host: Host, root: string): Promise<boolean> {
  const { manifestHashes } = await loadDepsProject(host, root)

  for (const [path, hash] of Object.entries(manifestHashes)) {
    if ((await currentHashOf(host, root, path, hash)) !== hash) {
      return true
    }
  }

  return false
}
