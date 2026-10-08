import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'

describe('deps-toast-levels', () => {
  test('the show levels from widest to narrowest, then off', () => {
    expect(Defaults.DEPS_LEVELS).toEqual([
      'all',
      'minor+',
      'major+breaking+security',
      'breaking+security',
    ])
    expect(Defaults.DEPS_TOAST_LEVELS).toEqual([...Defaults.DEPS_LEVELS, 'off'])
  })
})
