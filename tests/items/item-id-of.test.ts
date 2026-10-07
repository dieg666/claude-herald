import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('item-id-of', () => {
  const FULL = {
    guid: 'g-1',
    id: 'i-1',
    link: 'https://example.com/l',
    url: 'https://example.com/u',
    title: 'A title',
  }

  test('prefers the guid', () => {
    expect(Items.itemIdOf('hn', FULL)).toBe('hn:g-1')
  })

  test('then the id, then the link, then the url', () => {
    expect(Items.itemIdOf('hn', { ...FULL, guid: undefined })).toBe('hn:i-1')
    expect(Items.itemIdOf('hn', { ...FULL, guid: undefined, id: undefined })).toBe(
      'hn:https://example.com/l',
    )
    expect(Items.itemIdOf('hn', { url: 'https://example.com/u', title: 'A title' })).toBe(
      'hn:https://example.com/u',
    )
  })

  test('skips blank values', () => {
    expect(Items.itemIdOf('hn', { guid: '  ', id: '', link: ' https://example.com/l ' })).toBe(
      'hn:https://example.com/l',
    )
  })

  test('falls back to a hash of the title, stable across whitespace', () => {
    const id = Items.itemIdOf('hn', { title: 'A  title ' })

    expect(id).toBe(`hn:title-${Items.titleHashOf('A title')}`)
    expect(Items.itemIdOf('hn', { title: 'A title' })).toBe(id)
    expect(Items.itemIdOf('hn', { title: 'Another title' })).not.toBe(id)
  })

  test('the same entry from two sources gets two ids', () => {
    expect(Items.itemIdOf('a', FULL)).not.toBe(Items.itemIdOf('b', FULL))
  })
})
