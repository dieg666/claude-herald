import type { Host } from '../../host/host.js'
import { loadDepsProject } from '../../store/load-deps-project.js'
import { joinPath } from './join-path.js'
import { manifestHashOf } from './manifest-hash-of.js'

/**
 * Whether any manifest or lockfile the last detection read has changed or gone, by content hash; false for a project with nothing recorded. Only re-reads the recorded files, so a manifest added in a new place waits for the next session start or rescan.
 *
 * @param host the engine
 * @param root the project root, absolute
 */
export async function manifestsChanged(host: Host, root: string): Promise<boolean> {
  const { manifestHashes } = await loadDepsProject(host, root)

  for (const [path, hash] of Object.entries(manifestHashes)) {
    const text = await host.readText(joinPath(root, path)).catch(() => undefined)

    if (text === undefined || manifestHashOf(text) !== hash) {
      return true
    }
  }

  return false
}
