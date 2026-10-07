import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('current-summary-lang', () => {
  test('feed by default, a fixed code as it is', async () => {
    expect(await Summaries.currentSummaryLang(Fixtures.fakeHostOf().host)).toBe('feed')
    expect(
      await Summaries.currentSummaryLang(Fixtures.fakeHostOf({ settings: { lang: 'es' } }).host),
    ).toBe('es')
  })

  test("user is Claude Code's language setting", async () => {
    const { host } = Fixtures.fakeHostOf({ settings: { lang: 'user' } }, 'japanese')

    expect(await Summaries.currentSummaryLang(host)).toBe('japanese')
  })

  test('user falls back to feed when the setting is unset or unreadable', async () => {
    const unset = Fixtures.fakeHostOf({ settings: { lang: 'user' } }).host
    const failing = Fixtures.fakeHostOf({ settings: { lang: 'user' } }, 'japanese').host

    failing.userLanguage = async () => {
      throw new Error('settings unavailable')
    }

    expect(await Summaries.currentSummaryLang(unset)).toBe('feed')
    expect(await Summaries.currentSummaryLang(failing)).toBe('feed')
  })

  test('only user reads the language setting', async () => {
    const { host } = Fixtures.fakeHostOf({ settings: { lang: 'es' } }, 'japanese')
    let reads = 0

    host.userLanguage = async () => {
      reads += 1

      return 'japanese'
    }

    expect(await Summaries.currentSummaryLang(host)).toBe('es')
    expect(reads).toBe(0)
  })
})
