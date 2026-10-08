import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Summaries from '../../hooks/summaries'

describe('summaries-for', () => {
  test('maps item ids to the short texts of one language', () => {
    expect(
      Store.summariesFor(
        [
          {
            itemId: 'a',
            lang: 'es',
            kind: 'short',
            version: Summaries.SUMMARY_PROMPT_VERSION,
            text: 'uno',
          },
          {
            itemId: 'a',
            lang: 'en',
            kind: 'short',
            version: Summaries.SUMMARY_PROMPT_VERSION,
            text: 'one',
          },
          {
            itemId: 'b',
            lang: 'es',
            kind: 'long',
            version: Summaries.SUMMARY_PROMPT_VERSION,
            text: 'dos, largo',
          },
          {
            itemId: 'c',
            lang: 'es',
            kind: 'short',
            version: Summaries.SUMMARY_PROMPT_VERSION,
            text: 'tres',
          },
        ],
        'es',
      ),
    ).toEqual({ a: 'uno', c: 'tres' })
  })

  test('only texts the current prompt version wrote count, unless another version is asked for', () => {
    const entries = [
      { itemId: 'a', lang: 'es', kind: 'short' as const, version: 0, text: 'viejo' },
      {
        itemId: 'b',
        lang: 'es',
        kind: 'short' as const,
        version: Summaries.SUMMARY_PROMPT_VERSION,
        text: 'nuevo',
      },
    ]

    expect(Store.summariesFor(entries, 'es')).toEqual({ b: 'nuevo' })
    expect(Store.summariesFor(entries, 'es', 'short', 0)).toEqual({ a: 'viejo' })
  })
})
