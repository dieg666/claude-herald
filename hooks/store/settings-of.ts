import type { Settings } from '../../types/index.js'
import { DEFAULT_SETTINGS } from '../defaults/default-settings.js'
import { isRecord } from './is-record.js'

/**
 * A positive finite number, else undefined.
 *
 * @param value one stored field
 */
function positiveOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined
}

/**
 * A non-blank string, else undefined.
 *
 * @param value one stored field
 */
function filledOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

/**
 * Stored settings with every missing or unusable field taken from the defaults.
 *
 * @param value what the store holds under `settings`
 */
export function settingsOf(value: unknown): Settings {
  const stored = isRecord(value) ? value : {}

  return {
    refreshMinutes: positiveOf(stored.refreshMinutes) ?? DEFAULT_SETTINGS.refreshMinutes,
    rotateSeconds: positiveOf(stored.rotateSeconds) ?? DEFAULT_SETTINGS.rotateSeconds,
    lang: filledOf(stored.lang)?.trim() ?? DEFAULT_SETTINGS.lang,
    template: filledOf(stored.template) ?? DEFAULT_SETTINGS.template,
    depsTemplate: filledOf(stored.depsTemplate) ?? DEFAULT_SETTINGS.depsTemplate,
  }
}
