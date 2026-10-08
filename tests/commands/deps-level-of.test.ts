import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Defaults from '../../hooks/defaults'

describe('deps-level-of', () => {
  test('reads a level ignoring case and spaces', () => {
    expect(Commands.depsLevelOf(' Minor+ ', Defaults.DEPS_LEVELS)).toBe('minor+')
    expect(Commands.depsLevelOf('Breaking + Security', Defaults.DEPS_LEVELS)).toBe(
      'breaking+security',
    )
    expect(Commands.depsLevelOf('OFF', Defaults.DEPS_TOAST_LEVELS)).toBe('off')
  })

  test('a level not among those allowed is none', () => {
    expect(Commands.depsLevelOf('off', Defaults.DEPS_LEVELS)).toBeUndefined()
    expect(Commands.depsLevelOf('minor', Defaults.DEPS_LEVELS)).toBeUndefined()
    expect(Commands.depsLevelOf('', Defaults.DEPS_LEVELS)).toBeUndefined()
  })
})
