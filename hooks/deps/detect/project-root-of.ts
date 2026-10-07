import type { Host } from '../../host/host.js'
import { parentDirOf } from './parent-dir-of.js'
import type { ProjectRoot } from './project-root.js'
import { WALK_LIMITS } from './walk-limits.js'

/**
 * A directory without trailing separators, so two spellings of one path compare equal.
 *
 * @param dir an absolute path
 */
function trimmedOf(dir: string): string {
  return dir.length > 1 ? dir.replace(/[\\/]+$/, '') : dir
}

/**
 * Where to detect the stack from: the closest directory at or above the session's root that holds `.git` (a directory, or a file in a worktree), walked to the full depth; outside a repository the session's root alone, without descending; undefined when the session's root is a filesystem root.
 *
 * @param host the engine
 */
export async function projectRootOf(host: Host): Promise<ProjectRoot | undefined> {
  const start = await host.sessionRoot()

  if (parentDirOf(start) === undefined) {
    return undefined
  }

  const home = await host.homeDir().catch(() => undefined)
  const homeAndAbove = new Set<string>()

  for (let dir = home; dir !== undefined; dir = parentDirOf(dir)) {
    homeAndAbove.add(trimmedOf(dir))
  }

  // A .git at or above the home directory (a dotfiles repository) does not make a project.
  for (
    let dir: string | undefined = start;
    dir !== undefined && !homeAndAbove.has(trimmedOf(dir));
    dir = parentDirOf(dir)
  ) {
    const entries = await host.listDir(dir).catch(() => undefined)

    if (entries?.some(entry => entry.name === '.git')) {
      return { path: dir, maxDepth: WALK_LIMITS.maxDepth }
    }
  }

  return { path: start, maxDepth: 0 }
}
