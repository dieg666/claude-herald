import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Store from '../../hooks/store'

describe('settings-of', () => {
  test('nothing stored reads as the defaults', () => {
    expect(Store.settingsOf(undefined)).toEqual(Defaults.DEFAULT_SETTINGS)
  })

  test('a partial object gets every other field from the defaults', () => {
    expect(Store.settingsOf({ lang: 'es' })).toEqual({ ...Defaults.DEFAULT_SETTINGS, lang: 'es' })
    expect(Store.settingsOf({ refreshMinutes: 15 })).toEqual({
      ...Defaults.DEFAULT_SETTINGS,
      refreshMinutes: 15,
    })
  })

  test('unusable fields fall back to the defaults', () => {
    expect(
      Store.settingsOf({ refreshMinutes: 0, rotateSeconds: '20', lang: ' ', template: 7 }),
    ).toEqual(Defaults.DEFAULT_SETTINGS)
  })

  test('a whole stored object is read back as stored', () => {
    const own = { refreshMinutes: 10, rotateSeconds: 30, lang: 'user', template: '{url}' }

    expect(Store.settingsOf(own)).toEqual(own)
  })
})
