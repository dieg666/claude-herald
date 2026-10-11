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
      Store.settingsOf({
        refreshMinutes: 0,
        rotateSeconds: '20',
        lang: ' ',
        template: 7,
        depsTemplate: ' ',
      }),
    ).toEqual(Defaults.DEFAULT_SETTINGS)
  })

  test('automatic summaries are on only when stored as true; a store without the key reads as off', () => {
    const before = { refreshMinutes: 10, rotateSeconds: 30, lang: 'es', template: '{url}' }

    expect(Store.settingsOf(before).autoSummaries).toBe(false)
    expect(Store.settingsOf({ autoSummaries: true }).autoSummaries).toBe(true)

    for (const value of [false, 'true', 1, null, 'on']) {
      expect(Store.settingsOf({ autoSummaries: value }).autoSummaries).toBe(false)
    }
  })

  test("the band's size: settings stored before it read as three; a stored size outside 1 to 9 is clamped, anything else is three", () => {
    const before = { refreshMinutes: 10, rotateSeconds: 30, lang: 'es', template: '{url}' }

    expect(Store.settingsOf(before).bandSize).toBe(3)
    expect(Store.settingsOf({ bandSize: 5 }).bandSize).toBe(5)
    expect(Store.settingsOf({ bandSize: 0 }).bandSize).toBe(1)
    expect(Store.settingsOf({ bandSize: 50 }).bandSize).toBe(9)

    for (const value of ['x', '5', 2.5, null]) {
      expect(Store.settingsOf({ bandSize: value }).bandSize).toBe(3)
    }
  })

  test('a stored template is kept, not replaced by the default', () => {
    const stored = '{title} {url}'

    expect(Store.settingsOf({ template: stored }).template).toBe(stored)
  })

  test('a whole stored object is read back as stored', () => {
    const own = {
      refreshMinutes: 10,
      rotateSeconds: 30,
      bandSize: 5,
      lang: 'user',
      autoSummaries: true,
      template: '{url}',
      depsTemplate: '{pkg} {new}',
    }

    expect(Store.settingsOf(own)).toEqual(own)
  })
})
