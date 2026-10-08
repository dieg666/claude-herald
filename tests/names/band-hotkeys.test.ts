import { describe, expect, test } from 'claude-code/testing'

import Names from '../../hooks/names'

describe('band-hotkeys', () => {
  test('the band and action hotkeys are single lowercase letters, all distinct', () => {
    const hotkeys = [...Object.values(Names.BAND_HOTKEYS), ...Object.values(Names.ACTION_HOTKEYS)]

    expect(hotkeys.every(key => /^[a-z]$/.test(key))).toBe(true)
    expect(new Set(hotkeys).size).toBe(hotkeys.length)
    expect(Object.keys(Names.BAND_HOTKEYS).some(key => key in Names.ACTION_HOTKEYS)).toBe(false)
  })
})
