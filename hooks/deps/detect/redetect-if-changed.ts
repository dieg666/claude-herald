import type { DepsProject } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { loadDepsProject } from '../../store/load-deps-project.js'
import { detectDeps } from './detect-deps.js'
import { manifestsChanged } from './manifests-changed.js'
import { projectRootOf } from './project-root-of.js'

/**
 * Detects the stack again when a manifest or lockfile changed since the last detection and the stack is on; what the refresh timer calls. Never throws; does nothing at a filesystem root.
 *
 * @param host the engine
 * @returns the project's record when it detected again, undefined when nothing changed or it failed
 */
export async function redetectIfChanged(host: Host): Promise<DepsProject | undefined> {
  try {
    const root = await projectRootOf(host)

    if (root === undefined) {
      return undefined
    }

    const { settings } = await loadDepsProject(host, root.path)

    return settings.isEnabled && (await manifestsChanged(host, root.path))
      ? await detectDeps(host, root)
      : undefined
  } catch (error) {
    host.debug(
      `news: deps: change check failed: ${error instanceof Error ? error.message : String(error)}`,
    )

    return undefined
  }
}
