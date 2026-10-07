import type { DepsSettings } from '../../types/index.js'
import { DEFAULT_DEPS_SETTINGS } from '../defaults/default-deps-settings.js'
import { isRecord } from './is-record.js'

/**
 * Stored stack-detection settings with every missing or unusable field taken from the defaults.
 *
 * @param value what a project's record holds under `settings`
 */
export function depsSettingsOf(value: unknown): DepsSettings {
  const stored = isRecord(value) ? value : {}
  const { cap } = stored

  return {
    isEnabled:
      typeof stored.isEnabled === 'boolean' ? stored.isEnabled : DEFAULT_DEPS_SETTINGS.isEnabled,
    includeDev:
      typeof stored.includeDev === 'boolean' ? stored.includeDev : DEFAULT_DEPS_SETTINGS.includeDev,
    cap:
      typeof cap === 'number' && Number.isInteger(cap) && cap >= 0
        ? cap
        : DEFAULT_DEPS_SETTINGS.cap,
  }
}
