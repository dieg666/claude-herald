import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('icon-gap-of', () => {
  test('a glyph and its gap always take the two-cell column and one space, so headlines align', () => {
    for (const glyph of ['⚠', '📦', 'S', '*', '漢']) {
      const icon = Band.fitColumns(glyph, Band.ICON_COLUMNS)

      expect(Band.displayWidthOf(`${icon}${Band.iconGapOf(icon)}`)).toBe(Band.ICON_COLUMNS + 1)
    }

    expect(Band.iconGapOf('⚠')).toBe('  ')
    expect(Band.iconGapOf('📦')).toBe(' ')
  })
})
