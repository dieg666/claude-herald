import type { ThemeKey } from 'claude-code'

import type { StackRelease } from '../../../types/index.js'

/**
 * The theme color of a release level, for the part of a version that changed: major as error, minor as warning, patch as success, none for unknown; a 0.x minor bump is level major already.
 *
 * @param level the release level
 */
export function levelColorOf(level: StackRelease['level']): ThemeKey | undefined {
  switch (level) {
    case 'major':
      return 'error'
    case 'minor':
      return 'warning'
    case 'patch':
      return 'success'
    case 'unknown':
      return undefined
  }
}
