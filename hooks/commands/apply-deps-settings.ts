import type { DepsSettings } from '../../types/index.js'
import { mirrorStack } from '../deps/stack/mirror-stack.js'
import type { Host } from '../host/host.js'
import { updateDepsProject } from '../store/update-deps-project.js'

/**
 * Saves some of a project's stack settings, the others kept as stored, and mirrors the project's stack to state so the band and the pane follow at once.
 *
 * @param host the engine
 * @param root the project root
 * @param patch the fields to change
 * @returns the project's stack settings as stored now
 */
export async function applyDepsSettings(
  host: Host,
  root: string,
  patch: Partial<DepsSettings>,
): Promise<DepsSettings> {
  const { settings } = await updateDepsProject(host, root, project => ({
    ...project,
    settings: { ...project.settings, ...patch },
  }))

  await mirrorStack(host, root)

  return settings
}
