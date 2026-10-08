import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('normalized-url-of', () => {
  test('scheme and host are lower case, the fragment and a trailing slash go, the query stays', () => {
    expect(Items.normalizedUrlOf('HTTPS://Example.COM/Path/To/?id=1&b=2#top')).toBe(
      'https://example.com/Path/To?id=1&b=2',
    )
    expect(Items.normalizedUrlOf('https://example.com/')).toBe('https://example.com')
    expect(Items.normalizedUrlOf('https://example.com')).toBe('https://example.com')
  })

  test('addresses that differ only by those parts are equal; others are not', () => {
    const base = Items.normalizedUrlOf('https://example.com/a')

    expect(Items.normalizedUrlOf('https://EXAMPLE.com/a/#x')).toBe(base)
    expect(Items.normalizedUrlOf('https://example.com/A')).not.toBe(base)
    expect(Items.normalizedUrlOf('http://example.com/a')).not.toBe(base)
    expect(Items.normalizedUrlOf('https://example.com/a?p=1')).not.toBe(base)
  })

  test('anything but an absolute http(s) address has none', () => {
    expect(Items.normalizedUrlOf('')).toBeUndefined()
    expect(Items.normalizedUrlOf('/relative')).toBeUndefined()
    expect(Items.normalizedUrlOf('mailto:a@example.com')).toBeUndefined()
  })
})
