import type { Settings } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { settingsOf } from './settings-of.js'

/**
 * Changes some settings, reading the store right before writing so the other fields stay as stored.
 *
 * @param host the engine
 * @param patch the fields to change
 * @returns every setting as stored now
 */
export async function updateSettings(host: Host, patch: Partial<Settings>): Promise<Settings> {
  const next = { ...settingsOf(await host.storeGet(STORE_KEYS.settings)), ...patch }

  await host.storeSet(STORE_KEYS.settings, next)

  return next
}
