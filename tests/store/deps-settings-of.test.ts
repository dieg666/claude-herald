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
      showLevel: 'minor+',
      toastLevel: 'breaking+security',
    })
    expect(
      Store.depsSettingsOf({
        isEnabled: 'no',
        includeDev: 1,
        cap: '10',
        showLevel: 'major',
        toastLevel: 'none',
      }),
    ).toEqual(Defaults.DEFAULT_DEPS_SETTINGS)
    expect(Store.depsSettingsOf({ cap: 2.5 }).cap).toBe(50)
    expect(Store.depsSettingsOf({ isEnabled: false, cap: 1 })).toMatchObject({
      isEnabled: false,
      cap: 1,
    })
  })

  test('every show level is kept, and every toast level including off', () => {
    for (const level of Defaults.DEPS_LEVELS) {
      expect(Store.depsSettingsOf({ showLevel: level, toastLevel: level })).toMatchObject({
        showLevel: level,
        toastLevel: level,
      })
    }

    expect(Store.depsSettingsOf({ showLevel: 'off', toastLevel: 'off' })).toMatchObject({
      showLevel: 'minor+',
      toastLevel: 'off',
    })
  })

  test('a cap outside 1..500 is clamped to the nearest bound', () => {
    expect(Store.DEPS_CAP_BOUNDS).toEqual({ min: 1, max: 500 })
    expect(Store.depsSettingsOf({ cap: 0 }).cap).toBe(1)
    expect(Store.depsSettingsOf({ cap: -1 }).cap).toBe(1)
    expect(Store.depsSettingsOf({ cap: 500 }).cap).toBe(500)
    expect(Store.depsSettingsOf({ cap: 501 }).cap).toBe(500)
    expect(Store.depsSettingsOf({ cap: 1e9 }).cap).toBe(500)
  })
})
