import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('is-auto-summarizing', () => {
  test('false on a fresh store and on stored settings without the key, true once stored on', async () => {
    expect(await Summaries.isAutoSummarizing(Fixtures.fakeHostOf().host)).toBe(false)
    expect(
      await Summaries.isAutoSummarizing(
        Fixtures.fakeHostOf({ settings: { lang: 'es', rotateSeconds: 30 } }).host,
      ),
    ).toBe(false)
    expect(
      await Summaries.isAutoSummarizing(
        Fixtures.fakeHostOf({ settings: Fixtures.SUMMARIES_ON }).host,
      ),
    ).toBe(true)
  })

  test('a store that fails throws to the caller', async () => {
    const { host } = Fixtures.fakeHostOf()

    host.storeGet = async () => {
      throw new Error('store unavailable')
    }

    await expect(Summaries.isAutoSummarizing(host)).rejects.toThrow('store unavailable')
  })
})
