import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('headline-line-of', () => {
  const widthOf = (line: ReturnType<typeof Band.headlineLineOf>) =>
    Band.displayWidthOf(`${line.title}${line.sourceGap ?? ''}${line.source ?? ''}`)

  test('with room the name ends at the last cell, the headline whole', () => {
    for (const columns of [120, 80, 40]) {
      const line = Band.headlineLineOf('Margaret Hamilton has died', 'Hacker News', columns)

      expect(line.title).toBe('Margaret Hamilton has died')
      expect(line.source).toBe('Hacker News')
      expect(widthOf(line)).toBe(columns)
    }
  })

  test('the name is cut first, to the room the headline leaves, down to the minimum', () => {
    // 26 cells of headline and two of gap leave eight of forty.
    const line = Band.headlineLineOf('Margaret Hamilton has died', 'Simon Willison', 36)

    expect(line).toEqual({
      title: 'Margaret Hamilton has died',
      source: 'Simon W…',
      sourceGap: '  ',
    })
    expect(widthOf(line)).toBe(36)
  })

  test('below the minimum the name is dropped and only then does the headline lose cells', () => {
    const title = 'Margaret Hamilton has died'

    // Room for five cells: under the six-cell minimum, so no name and the headline whole.
    expect(Band.headlineLineOf(title, 'Simon Willison', 33)).toEqual({ title })
    expect(Band.headlineLineOf(title, 'Simon Willison', 26)).toEqual({ title })
    expect(Band.headlineLineOf(title, 'Simon Willison', 20)).toEqual({
      title: 'Margaret Hamilton h…',
    })
  })

  test('a name shorter than the minimum is kept whole or dropped, never cut', () => {
    expect(Band.headlineLineOf('abcdefghij', 'HN', 14)).toEqual({
      title: 'abcdefghij',
      source: 'HN',
      sourceGap: '  ',
    })
    expect(Band.headlineLineOf('abcdefghij', 'HN', 13)).toEqual({ title: 'abcdefghij' })
  })

  test('no name, or an empty one, leaves the headline alone, cut to the width', () => {
    expect(Band.headlineLineOf('A headline', undefined, 80)).toEqual({ title: 'A headline' })
    expect(Band.headlineLineOf('A headline', '', 80)).toEqual({ title: 'A headline' })
    expect(Band.headlineLineOf('A headline', undefined, 6)).toEqual({ title: 'A hea…' })
  })

  test('wide characters count two cells on both sides', () => {
    const line = Band.headlineLineOf('漢字の見出し', '日本のニュース', 40)

    expect(line.source).toBe('日本のニュース')
    expect(widthOf(line)).toBe(40)
  })
})
