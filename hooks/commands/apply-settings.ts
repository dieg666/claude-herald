import type { Settings } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { updateSettings } from '../store/update-settings.js'

/**
 * Saves some settings, the others kept as stored, and mirrors them all to state.
 *
 * @param host the engine
 * @param patch the fields to change
 * @returns every setting as stored now
 */
export async function applySettings(host: Host, patch: Partial<Settings>): Promise<Settings> {
  const settings = await updateSettings(host, patch)

  await host.state.settings.update(() => settings)

  return settings
}
