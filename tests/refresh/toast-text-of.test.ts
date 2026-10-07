import { describe, expect, test } from 'claude-code/testing'

import Refresh from '../../hooks/refresh'
import Fixtures from '../fixtures'

describe('toast-text-of', () => {
  const items = (...keys: string[]) => keys.map(key => Fixtures.itemAt(key))

  test('names the one new item', () => {
    expect(Refresh.toastTextOf(items('Alpha'))).toBe('1 new: Alpha')
  })

  test('names both of two', () => {
    expect(Refresh.toastTextOf(items('Alpha', 'Beta'))).toBe('2 new: Alpha, Beta')
  })

  test('names the first of many and counts them all', () => {
    expect(Refresh.toastTextOf(items('Alpha', 'Beta', 'Gamma'))).toBe('3 new: Alpha …')
    expect(Refresh.toastTextOf(items(...'abcdefghijkl'.split('')))).toBe('12 new: a …')
  })

  test('a long toast is cut at a word to the cap, with an ellipsis', () => {
    const title = `${'word '.repeat(60)}end`
    const text = Refresh.toastTextOf(items(title))

    expect(text.length).toBeLessThanOrEqual(Refresh.REFRESH_LIMITS.toastChars)
    expect(text).toMatch(/^1 new: word( word)* ?…$/)
    expect(text.endsWith('word…')).toBe(true)
    expect(Refresh.toastTextOf(items('x'.repeat(400), 'y')).length).toBe(
      Refresh.REFRESH_LIMITS.toastChars,
    )
  })

  test('is empty for none', () => {
    expect(Refresh.toastTextOf([])).toBe('')
  })
})
