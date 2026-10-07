import type { DepsSettings } from '../../types/index.js'

/**
 * A project's stack-detection settings before the user changes them: on, runtime dependencies only, at most 50.
 */
export const DEFAULT_DEPS_SETTINGS: Readonly<DepsSettings> = {
  isEnabled: true,
  includeDev: false,
  cap: 50,
}
