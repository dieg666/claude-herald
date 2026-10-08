import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'

describe('is-muted', () => {
  const AT = 10_000
  const WINDOW = Summaries.SUMMARY_LIMITS.rejectedWindowMs
  const rejected = (count: number) => ({
    itemId: 'src:a',
    lang: 'feed',
    kind: 'short' as const,
    count,
    at: AT,
  })

  test('two rejected replies mute for the window, one does not', () => {
    expect(Summaries.SUMMARY_LIMITS.rejectedTries).toBe(2)
    expect(WINDOW).toBe(60 * 60_000)
    expect(Summaries.isMuted(undefined, AT)).toBe(false)
    expect(Summaries.isMuted(rejected(1), AT)).toBe(false)
    expect(Summaries.isMuted(rejected(2), AT)).toBe(true)
    expect(Summaries.isMuted(rejected(3), AT + WINDOW - 1)).toBe(true)
    expect(Summaries.isMuted(rejected(2), AT + WINDOW)).toBe(false)
  })

  test('a clock behind the last rejection does not mute', () => {
    expect(Summaries.isMuted(rejected(2), AT - 1)).toBe(false)
  })
})
