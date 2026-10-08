import type { DepsSettings } from '../../types/index.js'

/**
 * A project's stack settings before the user changes them: on, runtime dependencies only, at most 50, minor releases and up shown, breaking and security ones toasted.
 */
export const DEFAULT_DEPS_SETTINGS: Readonly<DepsSettings> = {
  isEnabled: true,
  includeDev: false,
  cap: 50,
  showLevel: 'minor+',
  toastLevel: 'breaking+security',
}
