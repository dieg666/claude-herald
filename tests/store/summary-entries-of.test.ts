import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Summaries from '../../hooks/summaries'

describe('summary-entries-of', () => {
  test('keeps whole entries in order and drops the rest', () => {
    const entry = {
      itemId: 'a',
      lang: 'feed',
      kind: 'long',
      version: Summaries.SUMMARY_PROMPT_VERSION,
      text: 'x',
    }

    expect(
      Store.summaryEntriesOf([entry, { ...entry, kind: 'medium' }, { itemId: 'b' }, 3]),
    ).toEqual([entry])
    expect(Store.summaryEntriesOf({ a: 'x' })).toEqual([])
  })

  test('an entry without a whole version number reads as version 0', () => {
    const entry = { itemId: 'a', lang: 'feed', kind: 'short', text: 'x' }

    expect(
      Store.summaryEntriesOf([entry, { ...entry, version: '2' }, { ...entry, version: 1.5 }]),
    ).toEqual([0, 0, 0].map(version => ({ ...entry, version })))
  })
})
