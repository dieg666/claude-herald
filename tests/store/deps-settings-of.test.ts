import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Store from '../../hooks/store'

describe('deps-settings-of', () => {
  test('nothing stored reads as the defaults', () => {
    expect(Store.depsSettingsOf(undefined)).toEqual(Defaults.DEFAULT_DEPS_SETTINGS)
  })

  test('stored fields win, unusable ones fall back', () => {
    expect(Store.depsSettingsOf({ includeDev: true, cap: 10 })).toEqual({
      isEnabled: true,
      includeDev: true,
      cap: 10,
    })
    expect(Store.depsSettingsOf({ isEnabled: 'no', includeDev: 1, cap: -1 })).toEqual(
      Defaults.DEFAULT_DEPS_SETTINGS,
    )
    expect(Store.depsSettingsOf({ cap: 2.5 }).cap).toBe(50)
    expect(Store.depsSettingsOf({ isEnabled: false, cap: 0 })).toMatchObject({
      isEnabled: false,
      cap: 0,
    })
  })
})
