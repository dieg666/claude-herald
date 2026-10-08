import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('is-link-label', () => {
  test('a bare label, whatever its case or trailing mark, is one', () => {
    for (const text of [
      'Comments',
      ' comments ',
      'Discuss',
      'Discussion',
      'Link',
      'Read more…',
      'Continue reading »',
    ]) {
      expect(Items.isLinkLabel(text)).toBe(true)
    }
  })

  test('a label with a count is one', () => {
    expect(Items.isLinkLabel('Comments (12)')).toBe(true)
    expect(Items.isLinkLabel('12 comments')).toBe(true)
  })

  test('text that only starts with or contains a label is not', () => {
    expect(Items.isLinkLabel('')).toBe(false)
    expect(Items.isLinkLabel('Comments are closed on this post while we migrate')).toBe(false)
    expect(Items.isLinkLabel('Link rot and the web archive')).toBe(false)
    expect(Items.isLinkLabel('The source of the bug was found')).toBe(false)
  })
})
