import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Summaries from '../../hooks/summaries'

describe('summary-key-of', () => {
  test('is item id, language, kind and prompt version joined by bars, the current version by default', () => {
    expect(Store.summaryKeyOf('hn:42', 'es', 'short', 3)).toBe('hn:42|es|short|3')
    expect(Store.summaryKeyOf('hn:42', 'es', 'short')).toBe(
      `hn:42|es|short|${Summaries.SUMMARY_PROMPT_VERSION}`,
    )
  })

  test('another prompt version is another key', () => {
    expect(Store.summaryKeyOf('hn:42', 'es', 'short', 0)).not.toBe(
      Store.summaryKeyOf('hn:42', 'es', 'short'),
    )
  })

  test('a bar inside a part cannot make two keys collide', () => {
    expect(Store.summaryKeyOf('a|es', 'short', 'short')).not.toBe(
      Store.summaryKeyOf('a', 'es|short', 'short'),
    )
    expect(Store.summaryKeyOf('a|b', 'es', 'long', 1)).toBe('a%7Cb|es|long|1')
  })

  test('a literal escape inside a part stays distinct from an escaped bar', () => {
    expect(Store.summaryKeyOf('a%7Cb', 'es', 'long')).not.toBe(
      Store.summaryKeyOf('a|b', 'es', 'long'),
    )
  })
})
