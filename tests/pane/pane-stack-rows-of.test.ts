import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-stack-rows-of', () => {
  const rowsOf = (expanded: string[], columns = 80, selected = 0) => {
    const page = Pane.panePageOf({ tab: '@stack', selected }, [], {}, [], 20, {
      items: Fixtures.STACK_RELEASES,
      filter: '',
      expanded,
    })

    return Pane.paneStackRowsOf(page.stack!, page.span.selected, columns)
  }

  // A row as the terminal spells it, up to its date.
  const lineOf = (row: Pane.PaneRow) =>
    `${row.isSelected ? '›' : ' '}${row.isIndented === true ? '   ' : ' '}${row.icon ?? ''}${Band.iconGapOf(row.icon ?? '')}${row.title}${(row.cells ?? []).map(cell => cell.text).join('')}`

  test('one row per package: name, current → newest, level, flags naming their release, release count, date', () => {
    const rows = rowsOf([])

    expect(rows.map(row => [row.heading, row.icon, row.title, row.date])).toEqual([
      ['npm', '⚠', '@astrojs/node', 'Oct 6'],
      [undefined, '⚠', 'jsdom', 'Oct 5'],
      [undefined, '📦', 'astro', 'Oct 7'],
      [undefined, '📦', '…fontawesome-svg-core', 'Jul 15'],
      [undefined, '📦', 'lodash', 'May 1'],
      [undefined, '📦', 'left-pad', 'Oct 8'],
      ['PyPI', '⚠', 'requests', 'Apr 1'],
    ])
    expect(rows.map(row => lineOf(row).replace(/\s+/g, ' ').trim())).toEqual([
      '› ⚠ @astrojs/node 9.5.5 → 11.1.7 major security',
      '⚠ jsdom 25.0.1 → 30.1.2 major breaking in 30.0.0…',
      '📦 astro 5.18.1 → 7.3.7 major',
      '📦 …fontawesome-svg-core 7.1.0 → 7.3.1 minor 2 releases',
      '📦 lodash 4.17.20 → 4.17.21 patch',
      '📦 left-pad 1.0.0 → canary',
      '⚠ requests 2.31.0 → 2.31.1 patch security',
    ])
    expect(rows.map(row => row.href)).toEqual([
      'https://github.com/owner/@astrojs/node/releases/tag/v11.1.7',
      'https://github.com/owner/jsdom/releases/tag/v30.1.2',
      'https://github.com/owner/astro/releases/tag/v7.3.7',
      'https://github.com/owner/@fortawesome/fontawesome-svg-core/releases/tag/v7.3.1',
      'https://github.com/owner/lodash/releases/tag/v4.17.21',
      'https://github.com/owner/left-pad/releases/tag/vcanary',
      'https://github.com/owner/requests/releases/tag/v2.31.1',
    ])
  })

  test('the columns line up: every arrow, level and date starts in the same column, and no line passes the width', () => {
    for (const columns of [120, 80, 60, 40]) {
      const rows = rowsOf(['npm:jsdom'], columns)
      const packages = rows.filter(row => row.isIndented !== true).map(lineOf)
      const arrows = new Set(
        packages.map(line => Band.displayWidthOf(line.slice(0, line.indexOf('→')))),
      )
      const ends = new Set(rows.map(row => Band.displayWidthOf(lineOf(row))))

      expect(arrows.size).toBe(1)
      expect(ends.size).toBe(1)
      expect(rows.every(row => Band.displayWidthOf(lineOf(row)) + 1 + 6 <= columns)).toBe(true)
    }
  })

  test('only the changed part of the new version is colored, by the level: major error, minor warning, patch success, unknown none', () => {
    const colored = rowsOf([]).map(row =>
      (row.cells ?? []).flatMap(cell =>
        cell.color === undefined ? [] : [[cell.text, cell.color]],
      ),
    )

    expect(colored).toEqual([
      [['11.1.7', 'error']],
      [['30.1.2', 'error']],
      [['7.3.7', 'error']],
      [['3.1', 'warning']],
      [['21', 'success']],
      [],
      [['1', 'success']],
    ])

    const zod = Pane.panePageOf({ tab: '@stack', selected: 0 }, [], {}, [], 20, {
      items: [Fixtures.STACK_SAMPLE[5]!],
      filter: '',
      expanded: [],
    })
    const [row] = Pane.paneStackRowsOf(zod.stack!, 0, 80)

    // A 0.x minor bump is level major, so its change is drawn as a major one.
    expect(row?.cells?.filter(cell => cell.color !== undefined)).toEqual([
      { text: '4.0', color: 'error' },
    ])
  })

  test('an expanded package lists each release indented beneath it, with its own line, level, flags and date', () => {
    const rows = rowsOf(['npm:jsdom'], 80, 3)
    const releases = rows.filter(row => row.isIndented === true)

    expect(releases.map(row => [row.icon, row.title.trim(), row.date, row.isSelected])).toEqual([
      ['📦', '30.1.2', 'Oct 5', false],
      ['📦', '30.1.1', 'Sep 22', true],
      ['⚠', '30.0.0 · jsdom 30', 'Sep 1', false],
    ])
    expect(releases.map(row => lineOf(row).replace(/\s+/g, ' ').trim())).toEqual([
      '📦 30.1.2 major',
      '› 📦 30.1.1 major',
      '⚠ 30.0.0 · jsdom 30 major breaking',
    ])
    expect(releases.every(row => row.cells?.every(cell => cell.color === undefined))).toBe(true)
  })

  test("a package's row targets its highest stable release, dated by it, the change colored by that release's level while the level column keeps the package's highest", () => {
    const items = [
      Fixtures.stackItemAt('lib', '2.0.0-rc.1', {
        current: '1.2.0',
        level: 'major',
        isPrerelease: true,
        publishedAt: '2026-10-02T00:00:00Z',
      }),
      Fixtures.stackItemAt('pkg', '7.0.3', {
        current: '7.0.0',
        level: 'patch',
        publishedAt: '2026-10-01T00:00:00Z',
      }),
      Fixtures.stackItemAt('pkg', '8.0.0', {
        current: '7.0.0',
        level: 'major',
        publishedAt: '2026-09-01T00:00:00Z',
      }),
      Fixtures.stackItemAt('lib', '1.3.0', {
        current: '1.2.0',
        level: 'minor',
        publishedAt: '2026-08-01T00:00:00Z',
      }),
    ]
    const page = Pane.panePageOf({ tab: '@stack', selected: 0 }, [], {}, [], 20, {
      items,
      filter: '',
      expanded: [],
    })
    const rows = Pane.paneStackRowsOf(page.stack!, page.span.selected, 80)

    expect(rows.map(row => [lineOf(row).replace(/\s+/g, ' ').trim(), row.date, row.href])).toEqual([
      [
        '› 📦 pkg 7.0.0 → 8.0.0 major 2 releases',
        'Sep 1',
        'https://github.com/owner/pkg/releases/tag/v8.0.0',
      ],
      [
        '📦 lib 1.2.0 → 1.3.0 major 2 releases',
        'Aug 1',
        'https://github.com/owner/lib/releases/tag/v1.3.0',
      ],
    ])
    expect(rows.map(row => (row.cells ?? []).filter(cell => cell.color !== undefined))).toEqual([
      [{ text: '8.0.0', color: 'error' }],
      [{ text: '3.0', color: 'warning' }],
    ])
    expect((page.items as typeof items).map(item => item.release.version)).toEqual([
      '8.0.0',
      '1.3.0',
    ])
  })
})
