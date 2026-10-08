import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('has-text', () => {
  test('text of its own counts', () => {
    expect(Items.hasText({ text: 'The compiler now ships incremental builds.' })).toBe(true)
    expect(Items.hasText({ text: 'Comments are closed while we migrate' })).toBe(true)
  })

  test('blank text counts as none', () => {
    expect(Items.hasText({ text: '' })).toBe(false)
    expect(Items.hasText({ text: ' \n ' })).toBe(false)
  })

  test('a link label counts as none', () => {
    expect(Items.hasText({ text: 'Comments' })).toBe(false)
    expect(Items.hasText({ text: '  Discuss ' })).toBe(false)
  })
})
