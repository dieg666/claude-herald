import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('compact-band-model-of', () => {
  const SOURCES = [Fixtures.sourceAt('src', { name: 'Claude Code' })]
  const ITEMS = Fixtures.datedItemsOf('src', 7).map((item, index) =>
    index === 1 ? { ...item, title: 'Claude Code v2.1.293 adds a compact band to Herald' } : item,
  )

  const pageAt = (offset: number) =>
    Band.bandPageOf({ offset, selected: 0, isPaused: true }, ITEMS, 1)

  test('one item: its position as n/N, its headline linked, no summary or actions, and no name where the room is short', () => {
    expect(Band.compactBandModelOf(pageAt(0), SOURCES, 60)).toEqual({
      position: '1/7',
      isPaused: true,
      headline: { id: 'src:1', title: 'src 1', href: 'https://example.com/src/1' },
      rowCount: 1,
    })
    expect(Band.compactBandModelOf(pageAt(6), SOURCES, 60).position).toBe('7/7')
  })

  test('the headline is cut to the room beside the controls at their widest', () => {
    const room = 62 - Band.compactControlsColumnsOf(7) - 2
    const { headline } = Band.compactBandModelOf(pageAt(1), SOURCES, 62)

    expect(room).toBe(26)
    expect(headline.title).toBe('Claude Code v2.1.293 adds…')
    expect(Band.displayWidthOf(headline.title)).toBe(room)
  })

  test('one row while the headline gets 14 cells, two while the controls fit, else three; by the width and the total only', () => {
    const controls = Band.compactControlsColumnsOf(7)
    const rowsAt = (columns: number, offset = 0) =>
      Band.compactBandModelOf(pageAt(offset), SOURCES, columns).rowCount

    expect(rowsAt(controls + 2 + 14)).toBe(1)
    expect(rowsAt(controls + 2 + 13)).toBe(2)
    expect(rowsAt(controls)).toBe(2)
    expect(rowsAt(controls - 1)).toBe(3)

    for (const columns of [20, controls - 1, controls, controls + 15, controls + 16, 64]) {
      expect(new Set(ITEMS.map((item, offset) => rowsAt(columns, offset))).size).toBe(1)
    }
  })

  test('on a row of its own the source name, its gap and the headline take the whole width', () => {
    const columns = Band.compactControlsColumnsOf(7)
    const { headline, rowCount } = Band.compactBandModelOf(pageAt(1), SOURCES, columns)

    expect(rowCount).toBe(2)
    expect(headline.source).toBe('Claude Code')
    expect(Band.displayWidthOf(`${headline.source}  ${headline.title}`)).toBe(columns)
  })

  test('where the room is short a bare version tag leads with its source name; a non-http address is no link', () => {
    const items = [{ ...Fixtures.itemAt('v'), title: 'v2.1.293', url: 'file:///etc/hosts' }]
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, items, 1)

    expect(Band.compactBandModelOf(page, SOURCES, 60).headline).toEqual({
      id: 'src:v',
      title: 'Claude Code v2.1.293',
    })
  })

  test('the source name, cut to twelve cells, comes before the headline where the room holds the column, its gap and fourteen cells; by the width and the total only', () => {
    const controls = Band.compactControlsColumnsOf(7)
    const modelAt = (columns: number, offset = 0) =>
      Band.compactBandModelOf(pageAt(offset), SOURCES, columns)

    // One row: the room beside the controls is 28 cells at 64, the widest compact band for 7 items.
    expect(64 - controls - 2).toBe(28)
    expect(modelAt(64).headline).toEqual({
      id: 'src:1',
      source: 'Claude Code',
      title: 'src 1',
      href: 'https://example.com/src/1',
    })
    expect(modelAt(64, 1).headline.title).toBe('Claude Code v2…')
    expect(modelAt(63).headline.source).toBeUndefined()
    expect(modelAt(controls + 16).headline.source).toBeUndefined()
    // A row of its own: the whole width is the room.
    expect(modelAt(controls + 15).headline.source).toBe('Claude Code')
    expect(modelAt(28).headline.source).toBe('Claude Code')
    expect(modelAt(27).headline.source).toBeUndefined()

    for (const columns of [27, 28, controls + 15, controls + 16, 63, 64]) {
      const shown = ITEMS.map((item, offset) => modelAt(columns, offset).headline.source)

      expect(new Set(shown).size).toBe(1)
    }
  })

  test('with the name shown a bare version tag is drawn bare, a release in the release color, a long name cut with …', () => {
    const sources = [
      Fixtures.sourceAt('src', {
        name: 'Claude Code releases',
        url: 'https://github.com/anthropics/claude-code/releases.atom',
      }),
      Fixtures.sourceAt('hn', { name: 'Hacker News' }),
    ]
    const items = [
      { ...Fixtures.itemAt('v'), title: 'v2.1.293' },
      { ...Fixtures.itemAt('h'), sourceId: 'hn', title: 'A headline' },
    ]
    const headlineAt = (offset: number) =>
      Band.compactBandModelOf(
        Band.bandPageOf({ offset, selected: 0, isPaused: false }, items, 1),
        sources,
        40,
      ).headline

    expect(headlineAt(0)).toMatchObject({
      source: 'Claude Code…',
      isRelease: true,
      title: 'v2.1.293',
    })
    expect(headlineAt(1)).toMatchObject({ source: 'Hacker News', title: 'A headline' })
    expect(headlineAt(1).isRelease).toBeUndefined()
  })

  test('a gone source draws no name and the bare title', () => {
    const items = [{ ...Fixtures.itemAt('v'), sourceId: 'gone', title: 'v1.0.0' }]
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, items, 1)

    expect(Band.compactBandModelOf(page, SOURCES, 40).headline).toEqual({
      id: 'src:v',
      title: 'v1.0.0',
      href: 'https://example.com/v',
    })
  })

  test('a stack item keeps its 📦 or ⚠ and pkg current → new, cut after the glyph column', () => {
    const [react] = Fixtures.STACK_SAMPLE
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [react!], 1)
    const { headline } = Band.compactBandModelOf(page, SOURCES, 62)
    const room = 62 - Band.compactControlsColumnsOf(1) - 2

    // The glyph and its gap take three cells of the room; the cut drops the space before the ellipsis.
    expect(room - 3).toBe(23)
    expect(headline).toMatchObject({ icon: '⚠', title: 'react 18.2.0 → 19.0.0…' })
  })
})
