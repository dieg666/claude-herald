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

  test('a title that is only a version leads with its source name; others stay as they are', () => {
    const sources = [Fixtures.sourceAt('src', { name: 'Claude Code' })]
    const tags = ['v2.1.293', 'v2.1.294', 'v2.1.295'].map(key => Fixtures.itemAt(key))

    expect(Refresh.toastTextOf(tags.slice(0, 1), sources)).toBe('1 new: Claude Code v2.1.293')
    expect(Refresh.toastTextOf(tags.slice(0, 2), sources)).toBe(
      '2 new: Claude Code v2.1.293, Claude Code v2.1.294',
    )
    expect(Refresh.toastTextOf(tags, sources)).toBe('3 new: Claude Code v2.1.293 …')
    expect(Refresh.toastTextOf(items('Alpha'), sources)).toBe('1 new: Alpha')
    expect(Refresh.toastTextOf(tags.slice(0, 1), [])).toBe('1 new: v2.1.293')
  })

  test('is empty for none', () => {
    expect(Refresh.toastTextOf([])).toBe('')
  })
})
