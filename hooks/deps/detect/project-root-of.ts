import type { Host } from '../../host/host.js'
import { parentDirOf } from './parent-dir-of.js'

/**
 * The project root: the closest directory at or above the session's root that holds `.git` (a directory, or a file in a worktree); the session's root when none does.
 *
 * @param host the engine
 */
export async function projectRootOf(host: Host): Promise<string> {
  const start = await host.sessionRoot()

  for (let dir: string | undefined = start; dir !== undefined; dir = parentDirOf(dir)) {
    const entries = await host.listDir(dir).catch(() => undefined)

    if (entries?.some(entry => entry.name === '.git')) {
      return dir
    }
  }

  return start
}
