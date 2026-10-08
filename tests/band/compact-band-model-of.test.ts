import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Defaults from '../../hooks/defaults'
import Stack from '../../hooks/deps/stack'
import Fixtures from '../fixtures'

describe('compact-band-model-of', () => {
  const SOURCES = [Fixtures.sourceAt('src', { name: 'Claude Code' })]
  const ITEMS = Fixtures.datedItemsOf('src', 7).map((item, index) =>
    index === 1 ? { ...item, title: 'Claude Code v2.1.293 adds a compact band to Herald' } : item,
  )

  // A clock before every fixture date: a date that far ahead draws no age.
  const EPOCH = 0

  const pageAt = (offset: number) =>
    Band.bandPageOf({ offset, selected: 0, isPaused: true }, ITEMS, 1)

  test('one item: its position as n/N, its headline linked, no summary or actions, and no name where the room is short', () => {
    expect(Band.compactBandModelOf(pageAt(0), SOURCES, 60, EPOCH)).toEqual({
      position: '1/7',
      isPaused: true,
      headline: { id: 'src:1', title: 'src 1', href: 'https://example.com/src/1' },
      rowCount: 1,
    })
    expect(Band.compactBandModelOf(pageAt(6), SOURCES, 60, EPOCH).position).toBe('7/7')
  })

  test('the headline is cut to the room beside the controls at their widest', () => {
    const room = 62 - Band.compactControlsColumnsOf(7) - 2
    const { headline } = Band.compactBandModelOf(pageAt(1), SOURCES, 62, EPOCH)

    expect(room).toBe(26)
    expect(headline.title).toBe('Claude Code v2.1.293 adds…')
    expect(Band.displayWidthOf(headline.title)).toBe(room)
  })

  test('one row while the headline gets 14 cells, two while the controls fit, else three; by the width and the total only', () => {
    const controls = Band.compactControlsColumnsOf(7)
    const rowsAt = (columns: number, offset = 0) =>
      Band.compactBandModelOf(pageAt(offset), SOURCES, columns, EPOCH).rowCount

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
    const { headline, rowCount } = Band.compactBandModelOf(pageAt(1), SOURCES, columns, EPOCH)

    expect(rowCount).toBe(2)
    expect(headline.source).toBe('Claude Code')
    expect(Band.displayWidthOf(`${headline.source}  ${headline.title}`)).toBe(columns)
  })

  test('where the room is short a bare version tag leads with its source name; a non-http address is no link', () => {
    const items = [{ ...Fixtures.itemAt('v'), title: 'v2.1.293', url: 'file:///etc/hosts' }]
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, items, 1)

    expect(Band.compactBandModelOf(page, SOURCES, 60, EPOCH).headline).toEqual({
      id: 'src:v',
      title: 'Claude Code v2.1.293',
    })
  })

  test('the source name, cut to twelve cells, comes before the headline where the room holds the column, its gap and fourteen cells; by the width and the total only', () => {
    const controls = Band.compactControlsColumnsOf(7)
    const modelAt = (columns: number, offset = 0) =>
      Band.compactBandModelOf(pageAt(offset), SOURCES, columns, EPOCH)

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
        EPOCH,
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

    expect(Band.compactBandModelOf(page, SOURCES, 40, EPOCH).headline).toEqual({
      id: 'src:v',
      title: 'v1.0.0',
      href: 'https://example.com/v',
    })
  })

  test('a stack item keeps its 📦 or ⚠ and pkg current → new, cut after the glyph column', () => {
    const [react] = Fixtures.STACK_SAMPLE
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [react!], 1)
    const { headline } = Band.compactBandModelOf(page, SOURCES, 62, EPOCH)
    const room = 62 - Band.compactControlsColumnsOf(1) - 2

    // The glyph and its gap take three cells of the room; the cut drops the space before the ellipsis.
    expect(room - 3).toBe(23)
    expect(headline).toMatchObject({ icon: '⚠', title: 'react 18.2.0 → 19.0.0…' })
  })

  test("a factory source's short label is the name shown before the headline", () => {
    const [releases] = Defaults.FACTORY_SOURCES.filter(
      source => source.id === 'claude-code-releases',
    )
    const items = [{ ...Fixtures.itemAt('v'), sourceId: releases!.id, title: 'v2.1.294' }]
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, items, 1)

    expect(Band.compactBandModelOf(page, [releases!], 40, EPOCH).headline).toMatchObject({
      source: 'Claude Code',
      isRelease: true,
      title: 'v2.1.294',
    })
  })

  // Five hours after the newest dated item (2026-01-02T00:00Z).
  const NOW = Date.UTC(2026, 0, 2, 5)
  // The source column, its gap, the age column and its gap, and the headline's fewest cells.
  const AGE_ROOM = 12 + 2 + 4 + 2 + 14

  test('the age comes after the source name where the room holds the source column, the age column and the headline; by the width and the total only', () => {
    const controls = Band.compactControlsColumnsOf(7)
    const modelAt = (columns: number, offset = 0) =>
      Band.compactBandModelOf(pageAt(offset), SOURCES, columns, NOW)

    // One row: the room beside the controls.
    const wideOne = controls + 2 + AGE_ROOM
    const { headline } = modelAt(wideOne, 1)

    expect(modelAt(wideOne).rowCount).toBe(1)
    expect(headline.age).toBe('6h')
    expect(Band.displayWidthOf(`${headline.source}  ${headline.age}  ${headline.title}`)).toBe(
      AGE_ROOM,
    )
    expect(modelAt(wideOne - 1).headline.age).toBeUndefined()

    // The same on a row of its own, where the room is the whole width.
    const own = modelAt(controls)

    expect(own.rowCount).toBe(2)
    expect(own.headline.age).toBe('5h')

    for (const columns of [20, controls - 1, controls, wideOne - 1, wideOne, 120]) {
      expect(
        new Set(ITEMS.map((item, offset) => modelAt(columns, offset).headline.age !== undefined))
          .size,
      ).toBe(1)
    }
  })

  test('the headline gives up the age and its gap, never going under its fewest cells', () => {
    const controls = Band.compactControlsColumnsOf(7)

    for (const columns of [120, controls + 2 + AGE_ROOM]) {
      const { headline } = Band.compactBandModelOf(pageAt(1), SOURCES, columns, NOW)
      const room = columns - controls - 2

      expect(headline.source).toBe('Claude Code')
      expect(headline.age).toBe('6h')
      const width = Band.displayWidthOf(`${headline.source}  ${headline.age}  ${headline.title}`)

      expect(columns === 120 ? width <= room : width === room).toBe(true)
      expect(Band.displayWidthOf(headline.title)).toBeGreaterThanOrEqual(14)
    }
  })

  test('an undated or far-future item draws no age and keeps the whole headline', () => {
    const items = [Fixtures.itemAt('a'), Fixtures.itemAt('b', '2027-01-01T00:00:00Z')]

    for (const item of items) {
      const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [item], 1)
      const { headline } = Band.compactBandModelOf(page, SOURCES, 120, NOW)

      expect(headline.age).toBeUndefined()
    }

    expect(Band.compactBandModelOf(pageAt(0), SOURCES, 120, EPOCH).headline.age).toBeUndefined()
  })

  test('a stack item draws its age after its glyph where the room holds it', () => {
    const [react] = Fixtures.STACK_SAMPLE
    const page = Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [react!], 1)
    const { headline } = Band.compactBandModelOf(page, SOURCES, 120, Date.UTC(2026, 0, 7))

    expect(headline.icon).toBe('⚠')
    expect(headline.age).toBe('1d')
    expect(
      Band.displayWidthOf(`${headline.icon}  ${headline.age}  ${headline.title}`),
    ).toBeLessThanOrEqual(120 - Band.compactControlsColumnsOf(1) - 2)
  })

  test("a package's compact row names its target with ⚠ when another of its releases is breaking", () => {
    const [vite, zod] = Stack.stackPackageItemsOf(Fixtures.STACK_MIDDLE)
    const of = (item: typeof zod) =>
      Band.compactBandModelOf(
        Band.bandPageOf({ offset: 0, selected: 0, isPaused: false }, [item!], 1),
        SOURCES,
        100,
        EPOCH,
      ).headline

    expect(of(zod)).toMatchObject({ icon: '⚠', title: 'zod 3.23.8 → 4.6.5' })
    expect(of(vite)).toMatchObject({ icon: '📦', title: 'vite 5.0.0 → 5.2.0' })
  })
})
