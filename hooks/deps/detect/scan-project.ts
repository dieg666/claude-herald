import type { Dependency } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { baseNameOf } from './base-name-of.js'
import { depthOrder } from './depth-order.js'
import type { Detector } from './detector.js'
import { DETECTORS } from './detectors.js'
import { dirOf } from './dir-of.js'
import { listerOf } from './lister-of.js'
import { membersOf } from './members-of.js'
import type { ProjectFiles } from './project-files.js'
import { readFiles } from './read-files.js'
import type { Scan } from './scan.js'
import { WALK_LIMITS } from './walk-limits.js'
import { walkProject } from './walk-project.js'

/**
 * Whether a directory lies strictly below another, both relative to the root.
 *
 * @param dir the directory
 * @param parent the one it may lie below (`''` for the root)
 */
function isBelow(dir: string, parent: string): boolean {
  return parent === '' ? dir !== '' : dir.startsWith(`${parent}/`)
}

/**
 * Runs a parser step, logging and dropping its result when it throws.
 *
 * @param step the step
 * @param fallback what to use instead
 * @param debug one line in the debug log
 */
function guarded<T>(step: () => T, fallback: T, debug: (text: string) => void): T {
  try {
    return step()
  } catch (error) {
    debug(`a parser failed: ${error instanceof Error ? error.message : String(error)}`)

    return fallback
  }
}

/**
 * Walks a project, reads its manifests, lockfiles and workspace members, and collects every dependency each ecosystem declares. Inside a workspace that names members only the workspace root, its members and manifests with a lockfile of their own are read for that ecosystem; other manifests below it (fixtures, templates) are left out.
 *
 * @param host the engine
 * @param root the project root, absolute
 * @param detectors the ecosystems to look for
 * @param limits how deep and how many directories to list
 */
export async function scanProject(
  host: Host,
  root: string,
  detectors: readonly Detector[] = DETECTORS,
  limits: { maxDepth: number; maxDirs: number } = WALK_LIMITS,
): Promise<Scan> {
  const debug = (text: string) => host.debug(`news: deps: ${text}`)
  const list = listerOf(host, root, limits.maxDirs, debug)
  const keeps = (name: string) =>
    detectors.some(detector => detector.isManifest(name) || detector.isCompanion(name))
  const texts = new Map<string, string>()
  const oversized = new Map<string, number>()
  const files: ProjectFiles = { texts, debug }

  const walked = await walkProject(list, keeps, limits.maxDepth)

  await readFiles(host, root, walked, texts, oversized, debug)

  const dependencies: Dependency[] = []

  for (const detector of detectors) {
    const workspaces = guarded(() => detector.workspacesOf(files), [], debug).filter(
      workspace => workspace.include.length > 0,
    )
    const members = new Set<string>()

    for (const workspace of workspaces) {
      const found = await membersOf(workspace, list, limits.maxDepth, debug)

      await readFiles(host, root, found, texts, oversized, debug)

      for (const path of found.keys()) {
        members.add(dirOf(path))
      }
    }

    const ownLockDirs = new Set(
      [...walked.keys()]
        .filter(path => detector.isOwnLockfile?.(baseNameOf(path)) === true)
        .map(dirOf),
    )
    const manifests = [...texts.keys()]
      .filter(path => detector.isManifest(baseNameOf(path)))
      .filter(path => {
        const dir = dirOf(path)

        return (
          members.has(dir) ||
          ownLockDirs.has(dir) ||
          !workspaces.some(workspace => isBelow(dir, workspace.dir))
        )
      })
      .sort(depthOrder)

    dependencies.push(...guarded(() => detector.depsOf(files, manifests), [], debug))
  }

  return { dependencies, texts, oversized }
}
