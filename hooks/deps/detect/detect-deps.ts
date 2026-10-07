import type { DepsProject } from '../../../types/index.js'
import type { Host } from '../../host/host.js'
import { loadDepsProject } from '../../store/load-deps-project.js'
import { saveDetection } from '../../store/save-detection.js'
import { DETECTORS } from './detectors.js'
import { manifestHashOf } from './manifest-hash-of.js'
import { oversizedHashOf } from './oversized-hash-of.js'
import type { ProjectRoot } from './project-root.js'
import { projectRootOf } from './project-root-of.js'
import { scanProject } from './scan-project.js'
import { selectDeps } from './select-deps.js'
import { WALK_LIMITS } from './walk-limits.js'

/**
 * Detects the project's stack and stores it under the project root: the followed dependencies and the hash of every manifest and lockfile read (the size of one too large to read). Does nothing for a project whose stack is turned off, or when the session's root is a filesystem root. Never throws: a failure is one debug line.
 *
 * @param host the engine
 * @param at where to detect from and how deep; looked up from the session when absent
 * @returns the project's record as stored now, or undefined when detection was skipped or failed
 */
export async function detectDeps(host: Host, at?: ProjectRoot): Promise<DepsProject | undefined> {
  try {
    const root = at ?? (await projectRootOf(host))

    if (root === undefined) {
      host.debug('news: deps: skipped detection: the session runs at a filesystem root')

      return undefined
    }

    const project = await loadDepsProject(host, root.path)

    if (!project.settings.isEnabled) {
      return project
    }

    const scan = await scanProject(host, root.path, DETECTORS, {
      ...WALK_LIMITS,
      maxDepth: root.maxDepth,
    })
    const { followed, detectedCount } = selectDeps(scan.dependencies, project.settings)
    const manifestHashes = Object.fromEntries([
      ...[...scan.texts].map(([path, text]) => [path, manifestHashOf(text)]),
      ...[...scan.oversized].map(([path, size]) => [path, oversizedHashOf(size)]),
    ])

    return await saveDetection(host, root.path, {
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
