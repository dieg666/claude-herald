import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('url-key-of', () => {
  test('the scheme, host case, trailing slashes and fragment do not count', () => {
    const key = Commands.urlKeyOf('https://example.org/feed')

    for (const url of [
      'http://example.org/feed',
      'https://EXAMPLE.org/feed/',
      'https://example.org/feed//#top',
      '  https://example.org/feed  ',
    ]) {
      expect(Commands.urlKeyOf(url)).toBe(key)
    }
  })

  test('the path, its case and the query do', () => {
    const key = Commands.urlKeyOf('https://example.org/feed')

    expect(Commands.urlKeyOf('https://example.org/Feed')).not.toBe(key)
    expect(Commands.urlKeyOf('https://example.org/feed?page=2')).not.toBe(key)
    expect(Commands.urlKeyOf('https://example.org:8443/feed')).not.toBe(key)
  })

  test('text that does not parse is its trimmed lowercase self', () => {
    expect(Commands.urlKeyOf(' Not A URL ')).toBe('not a url')
  })
})
