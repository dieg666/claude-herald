import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('is-link-identified', () => {
  const URL = 'https://example.com/a'

  test('an id derived from the link is link-identified, as the feed gives it for an entry with no guid', () => {
    const id = Items.itemIdOf('src', { link: URL, title: 'A' })

    expect(Items.isLinkIdentified({ id: id ?? '', sourceId: 'src', url: URL })).toBe(true)
  })

  test('an id derived from a guid is not, even when the entry has a link', () => {
    const id = Items.itemIdOf('src', { guid: 'g-1', link: URL, title: 'A' })

    expect(Items.isLinkIdentified({ id: id ?? '', sourceId: 'src', url: URL })).toBe(false)
  })

  test('an id from a title hash is not, nor one of another source', () => {
    const id = Items.itemIdOf('src', { title: 'A' })

    expect(Items.isLinkIdentified({ id: id ?? '', sourceId: 'src', url: URL })).toBe(false)
    expect(Items.isLinkIdentified({ id: `other:${URL}`, sourceId: 'src', url: URL })).toBe(false)
  })
})
