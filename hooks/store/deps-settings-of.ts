import type { DepsSettings } from '../../types/index.js'
import { DEFAULT_DEPS_SETTINGS } from '../defaults/default-deps-settings.js'
import { DEPS_LEVELS, DEPS_TOAST_LEVELS } from '../defaults/deps-levels.js'
import { DEPS_CAP_BOUNDS } from './deps-cap-bounds.js'
import { isRecord } from './is-record.js'

/**
 * Stored stack settings with every missing or unusable field taken from the defaults, and the cap clamped to its bounds.
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
      typeof cap === 'number' && Number.isInteger(cap)
        ? Math.min(DEPS_CAP_BOUNDS.max, Math.max(DEPS_CAP_BOUNDS.min, cap))
        : DEFAULT_DEPS_SETTINGS.cap,
    showLevel:
      DEPS_LEVELS.find(level => level === stored.showLevel) ?? DEFAULT_DEPS_SETTINGS.showLevel,
    toastLevel:
      DEPS_TOAST_LEVELS.find(level => level === stored.toastLevel) ??
      DEFAULT_DEPS_SETTINGS.toastLevel,
  }
}
