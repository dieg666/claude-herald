import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('source-column-of', () => {
  test('a label and its gap always take the column and two cells more, so headlines align', () => {
    for (const label of ['', 'HN', 'Hacker News', 'Claude Code releases', '日本のニュース']) {
      const { source, sourceGap } = Band.sourceColumnOf(label, 12)

      expect([label, Band.displayWidthOf(`${source}${sourceGap}`)]).toEqual([label, 14])
    }
  })

  test('a label wider than the column is cut with …, wide characters as two cells', () => {
    expect(Band.sourceColumnOf('Claude Code releases', 12)).toEqual({
      source: 'Claude Code…',
      sourceGap: '  ',
    })
    expect(Band.sourceColumnOf('Simon Willison', 12).source).toBe('Simon Willi…')
    expect(Band.sourceColumnOf('日本のニュース', 12)).toEqual({
      source: '日本のニュ…',
      sourceGap: '   ',
    })
  })

  test('a wide name, CJK or emoji, is cut at whole characters and its column and gap still take fourteen cells', () => {
    for (const label of [
      '東京ニュース速報まとめ',
      '🦀🦀🦀🦀🦀🦀🦀',
      '📦 Rust 新闻 🦀',
      '漢a漢a漢a漢a',
    ]) {
      const { source, sourceGap } = Band.sourceColumnOf(label, 12)

      expect([label, Band.displayWidthOf(`${source}${sourceGap}`)]).toEqual([label, 14])
      expect(Band.displayWidthOf(source) <= 12).toBe(true)
    }

    expect(Band.sourceColumnOf('🦀🦀🦀🦀🦀🦀🦀', 12)).toEqual({
      source: '🦀🦀🦀🦀🦀…',
      sourceGap: '   ',
    })
  })

  test('a label that fits is kept whole and padded; none is all gap', () => {
    expect(Band.sourceColumnOf('HN', 12)).toEqual({ source: 'HN', sourceGap: ' '.repeat(12) })
    expect(Band.sourceColumnOf('', 9)).toEqual({ source: '', sourceGap: ' '.repeat(11) })
  })
})
