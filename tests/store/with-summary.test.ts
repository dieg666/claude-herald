import type { SummaryEntry } from '../../types/index.js'
import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Summaries from '../../hooks/summaries'

describe('with-summary', () => {
  const entryOf = (itemId: string, text = itemId): SummaryEntry => ({
    itemId,
    lang: 'es',
    kind: 'short',
    version: Summaries.SUMMARY_PROMPT_VERSION,
    text,
  })

  test('adds the entry as the newest', () => {
    expect(Store.withSummary([entryOf('a')], entryOf('b'))).toEqual([entryOf('a'), entryOf('b')])
  })

  test('replaces the entry under the same key and makes it the newest', () => {
    expect(Store.withSummary([entryOf('a'), entryOf('b')], entryOf('a', 'again'))).toEqual([
      entryOf('b'),
      entryOf('a', 'again'),
    ])
  })

  test('replaces the entry of the same item, language and kind an older prompt version wrote', () => {
    const old = { ...entryOf('a', 'old'), version: 0 }

    expect(Store.withSummary([old, entryOf('b')], entryOf('a'))).toEqual([
      entryOf('b'),
      entryOf('a'),
    ])
  })

  test('another language or kind is another key', () => {
    const long = { ...entryOf('a'), kind: 'long' as const }
    const english = { ...entryOf('a'), lang: 'en' }

    expect(Store.withSummary(Store.withSummary([entryOf('a')], long), english)).toEqual([
      entryOf('a'),
      long,
      english,
    ])
  })

  test('caps the cache at 300, evicting the oldest', () => {
    let entries: SummaryEntry[] = []

    for (let index = 0; index < 305; index += 1) {
      entries = Store.withSummary(entries, entryOf(`i${index}`))
    }

    expect(Store.SUMMARY_CACHE_MAX).toBe(300)
    expect(entries.length).toBe(300)
    expect(entries[0]?.itemId).toBe('i5')
    expect(entries[299]?.itemId).toBe('i304')
  })

  test('takes another cap', () => {
    expect(Store.withSummary([entryOf('a'), entryOf('b')], entryOf('c'), 2)).toEqual([
      entryOf('b'),
      entryOf('c'),
    ])
  })
})
