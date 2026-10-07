import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('put-summary', () => {
  test('stores the summary and finds it by item, language and kind', async () => {
    const { host, stored } = Fixtures.fakeHostOf()

    await Store.putSummary(host, { itemId: 'src:a', lang: 'es', kind: 'short', text: 'Hola' })

    const entries = await Store.loadSummaries(host)

    expect(stored.get('summaries')).toEqual(entries)
    expect(Store.summaryOf(entries, 'src:a', 'es', 'short')).toBe('Hola')
    expect(Store.summaryOf(entries, 'src:a', 'en', 'short')).toBeUndefined()
    expect(Store.summaryOf(entries, 'src:a', 'es', 'long')).toBeUndefined()
  })

  test('keeps the stored cache capped when it is already full', async () => {
    const full = Array.from({ length: Store.SUMMARY_CACHE_MAX }, (_, index) => ({
      itemId: `src:${index}`,
      lang: 'feed',
      kind: 'short',
      text: `${index}`,
    }))

    const { host } = Fixtures.fakeHostOf({ summaries: full })

    const entries = await Store.putSummary(host, {
      itemId: 'src:new',
      lang: 'feed',
      kind: 'short',
      text: 'new',
    })

    expect(entries.length).toBe(Store.SUMMARY_CACHE_MAX)
    expect(Store.summaryOf(entries, 'src:0', 'feed', 'short')).toBeUndefined()
    expect(Store.summaryOf(entries, 'src:new', 'feed', 'short')).toBe('new')
  })
})
