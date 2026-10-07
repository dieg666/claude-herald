import type { DepsProject } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { loadDepsProject } from '../../store/load-deps-project.js'
import { saveDetection } from '../../store/save-detection.js'
import { manifestHashOf } from './manifest-hash-of.js'
import { projectRootOf } from './project-root-of.js'
import { scanProject } from './scan-project.js'
import { selectDeps } from './select-deps.js'

/**
 * Detects the project's stack and stores it under the project root: the followed dependencies and the hash of every manifest and lockfile read. Does nothing for a project whose stack is turned off. Never throws: a failure is one debug line.
 *
 * @param host the engine
 * @param root the project root; looked up from the session when absent
 * @returns the project's record as stored now, or undefined when detection failed
 */
export async function detectDeps(host: Host, root?: string): Promise<DepsProject | undefined> {
  try {
    const projectRoot = root ?? (await projectRootOf(host))
    const project = await loadDepsProject(host, projectRoot)

    if (!project.settings.isEnabled) {
      return project
    }

    const scan = await scanProject(host, projectRoot)
    const { followed, detectedCount } = selectDeps(scan.dependencies, project.settings)
    const manifestHashes = Object.fromEntries(
      [...scan.texts].map(([path, text]) => [path, manifestHashOf(text)]),
    )

    return await saveDetection(host, projectRoot, {
      dependencies: followed,
      detectedCount,
      manifestHashes,
    })
  } catch (error) {
    host.debug(
      `news: deps: detection failed: ${error instanceof Error ? error.message : String(error)}`,
    )

    return undefined
  }
}
