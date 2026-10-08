import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'

describe('default-deps-settings', () => {
  test('on, runtime dependencies only, at most 50, minor and up shown, breaking and security toasted', () => {
    expect(Defaults.DEFAULT_DEPS_SETTINGS).toEqual({
      isEnabled: true,
      includeDev: false,
      cap: 50,
      showLevel: 'minor+',
      toastLevel: 'breaking+security',
    })
  })
})
