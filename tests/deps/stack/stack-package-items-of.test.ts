import { describe, expect, test } from 'claude-code/testing'

import type { StackItem } from '../../../types/index.js'
import Band from '../../../hooks/band'
import Stack from '../../../hooks/deps/stack'
import Pane from '../../../hooks/pane'
import Fixtures from '../../fixtures'

describe('stack-package-items-of', () => {
  const versionsOf = (items: readonly StackItem[]) =>
    items.map(item => [
      item.release.name,
      item.release.current,
      item.release.version,
      item.publishedAt,
    ])

  test('one item per package, the newest target first', () => {
    const items = Stack.stackPackageItemsOf(Fixtures.STACK_MIDDLE)

    expect(versionsOf(items)).toEqual([
      ['vite', '5.0.0', '5.2.0', '2026-09-18T00:00:00Z'],
      ['zod', '3.23.8', '4.6.5', '2026-09-13T00:00:00Z'],
      ['ky', '0.9.0', '1.0.0', '2026-09-07T00:00:00Z'],
    ])
  })

  test('ties keep the order given, and undated targets come last', () => {
    const items = Stack.stackPackageItemsOf([
      Fixtures.stackItemAt('undated', '1.0.0'),
      Fixtures.stackItemAt('a', '1.0.0', { publishedAt: '2026-09-01T00:00:00Z' }),
      Fixtures.stackItemAt('b', '1.0.0', { publishedAt: '2026-09-01T00:00:00Z' }),
    ])

    expect(items.map(item => item.release.name)).toEqual(['a', 'b', 'undated'])
    expect(Stack.stackPackageItemsOf([])).toEqual([])
  })

  test('the band, the All tab and the Your stack tab agree on current → target and the date of every package', () => {
    const { sources, items } = Fixtures.SKEWED_BAND
    const stackTab = Stack.stackTabPackagesOf(Fixtures.STACK_MIDDLE, '').map(pkg => [
      pkg.name,
      pkg.target.release.current,
      pkg.target.release.version,
      pkg.target.publishedAt,
    ])
    const fromBand = Band.bandItemsOf(sources, items, Fixtures.STACK_MIDDLE).filter(
      Stack.isStackItem,
    )
    const fromAll = Pane.allTabItemsOf(sources, items, Fixtures.STACK_MIDDLE).filter(
      Stack.isStackItem,
    )
    const sorted = (rows: readonly (readonly unknown[])[]) =>
      [...rows].map(row => row.join('|')).sort()

    expect(stackTab).toHaveLength(3)
    expect(sorted(versionsOf(fromBand))).toEqual(sorted(stackTab))
    expect(sorted(versionsOf(fromAll))).toEqual(sorted(stackTab))
    expect(fromBand).toEqual(fromAll)
  })
})
