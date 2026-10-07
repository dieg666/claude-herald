import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('item-of', () => {
  test("keeps an item's known fields, optional ones only when present", () => {
    const item = { ...Fixtures.itemAt('a', '2026-01-01T00:00:00Z'), lang: 'en' }

    expect(Store.itemOf({ ...item, savedAt: 3, extra: true })).toEqual(item)
    expect(Store.itemOf(Fixtures.itemAt('b'))).toEqual(Fixtures.itemAt('b'))
  })

  test('undefined without an id, source, title or url', () => {
    const { url, ...noUrl } = Fixtures.itemAt('a')

    expect(url).toBeDefined()
    expect(Store.itemOf(noUrl)).toBeUndefined()
    expect(Store.itemOf(null)).toBeUndefined()
  })

  test('undefined when the id, source, title or url is blank', () => {
    for (const field of ['id', 'sourceId', 'title', 'url'] as const) {
      expect(Store.itemOf({ ...Fixtures.itemAt('a'), [field]: '  ' }), field).toBeUndefined()
    }
  })
})
