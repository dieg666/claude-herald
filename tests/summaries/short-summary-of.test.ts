import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'

describe('short-summary-of', () => {
  test('a reply of several lines becomes one', () => {
    expect(Summaries.shortSummaryOf('First part.\n\nSecond part.\r\nThird.')).toBe(
      'First part. Second part. Third.',
    )
  })

  test('bullets, wrapping quotes and extra spaces are dropped', () => {
    expect(Summaries.shortSummaryOf('  - "Claude Code adds   mods."  ')).toBe(
      'Claude Code adds mods.',
    )
    expect(Summaries.shortSummaryOf('1. One\n2. Two')).toBe('One Two')
  })

  test('a long reply is cut at a word to fit, an ellipsis marking the cut', () => {
    const text = Summaries.shortSummaryOf('word '.repeat(100)) ?? ''

    expect(text.length).toBeLessThanOrEqual(Summaries.SUMMARY_LIMITS.shortChars)
    expect(text.endsWith('word…')).toBe(true)
    expect(text).not.toContain('\n')
  })

  test('a blank reply gives nothing', () => {
    expect(Summaries.shortSummaryOf('')).toBeUndefined()
    expect(Summaries.shortSummaryOf(' \n "" \n')).toBeUndefined()
  })
})
