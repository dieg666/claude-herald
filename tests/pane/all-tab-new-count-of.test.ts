import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('all-tab-new-count-of', () => {
  const CODE = Fixtures.sourceAt('code', {
    url: 'https://github.com/anthropics/claude-code/releases.atom',
  })
  const HN = Fixtures.sourceAt('hn')
  const ITEMS = { code: Fixtures.datedItemsOf('code', 3), hn: Fixtures.datedItemsOf('hn', 4) }

  test('a release feed shows its newest release only on All, so two new releases count 2 on the source and 1 on All', () => {
    const viewed = { code: ['code:3'] }

    expect(Pane.paneNewCountsOf(ITEMS, viewed)).toEqual({ code: 2 })
    expect(Pane.allTabNewCountOf([CODE], ITEMS, viewed)).toBe(1)
    expect(Pane.allTabNewCountOf([CODE], ITEMS, { code: ['code:3', 'code:1'] })).toBe(0)
  })

  test('news-only sources count as their source tabs do, so All is their sum', () => {
    const viewed = { hn: ['hn:4'], other: [] }
    const counts = Pane.paneNewCountsOf(ITEMS, viewed)

    expect(counts).toEqual({ hn: 3 })
    expect(Pane.allTabNewCountOf([HN], ITEMS, viewed)).toBe(3)
    expect(Pane.allTabNewCountOf([HN], ITEMS, { hn: [] })).toBe(4)
  })

  test('a source with no viewed ids yet, a disabled one and a source with no items contribute nothing', () => {
    const viewed = { hn: ['hn:4'] }

    expect(Pane.allTabNewCountOf([CODE, HN], ITEMS, viewed)).toBe(3)
    expect(Pane.allTabNewCountOf([CODE, { ...HN, isEnabled: false }], ITEMS, viewed)).toBe(0)
    expect(Pane.allTabNewCountOf([CODE, HN], ITEMS, {})).toBe(0)
    expect(Pane.allTabNewCountOf([Fixtures.sourceAt('empty')], ITEMS, { empty: [] })).toBe(0)
    expect(Pane.allTabNewCountOf([], ITEMS, viewed)).toBe(0)
  })

  test('mixed sources add the release feed newest and the news items', () => {
    expect(Pane.allTabNewCountOf([CODE, HN], ITEMS, { code: ['code:3'], hn: ['hn:4'] })).toBe(4)
  })
})
