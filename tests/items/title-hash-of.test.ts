import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('title-hash-of', () => {
  test('is 8 hex digits, the FNV-1a hash of the collapsed title', () => {
    expect(Items.titleHashOf('')).toBe('811c9dc5')
    expect(Items.titleHashOf('a')).toBe('e40c292c')
    expect(Items.titleHashOf(' a ')).toBe('e40c292c')
  })
})
