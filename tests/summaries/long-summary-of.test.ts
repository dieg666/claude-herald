import { describe, expect, test } from 'claude-code/testing'

import Summaries from '../../hooks/summaries'

describe('long-summary-of', () => {
  test('a reply of 3 to 5 lines keeps its lines, bullets and blank lines dropped', () => {
    expect(Summaries.longSummaryOf('- One.\n\n* Two.\n3. Three.\n  Four.  ')).toBe(
      'One.\nTwo.\nThree.\nFour.',
    )
  })

  test('more than five lines keeps the first five', () => {
    const reply = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].join('\n')

    expect(Summaries.longSummaryOf(reply)).toBe('a\nb\nc\nd\ne')
  })

  test('one paragraph is split at its sentences into 3 to 5 lines', () => {
    expect(Summaries.longSummaryOf('One. Two! Three? Four.')).toBe('One.\nTwo!\nThree?\nFour.')

    const nine = Array.from({ length: 9 }, (_, index) => `S${index}.`).join(' ')
    const lines = (Summaries.longSummaryOf(nine) ?? '').split('\n')

    expect(lines.length).toBeGreaterThanOrEqual(3)
    expect(lines.length).toBeLessThanOrEqual(5)
    expect(lines.join(' ')).toBe(nine)
  })

  test('ideographic full stops split sentences too', () => {
    expect(Summaries.longSummaryOf('一。二。三。')).toBe('一。\n二。\n三。')
  })

  test('a reply of fewer than three sentences is kept as it is, not padded', () => {
    expect(Summaries.longSummaryOf('Only one sentence here.')).toBe('Only one sentence here.')
  })

  test('each line is cut to fit, and a blank reply gives nothing', () => {
    const lines = (Summaries.longSummaryOf(`${'word '.repeat(200)}\nb\nc`) ?? '').split('\n')

    expect(lines[0]?.length).toBeLessThanOrEqual(Summaries.SUMMARY_LIMITS.longLineChars)
    expect(lines.length).toBe(3)
    expect(Summaries.longSummaryOf('\n \n')).toBeUndefined()
  })
})
