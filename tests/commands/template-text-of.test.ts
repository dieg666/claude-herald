import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('template-text-of', () => {
  test('one pair of quotes around the whole text is removed, then the text trimmed', () => {
    expect(Commands.templateTextOf('" {pkg} is out "')).toBe('{pkg} is out')
    expect(Commands.templateTextOf('\'say "why" {url}\'')).toBe('say "why" {url}')
  })

  test('quotes that also appear inside, or do not enclose it all, are kept', () => {
    expect(Commands.templateTextOf('"a" {url} "b"')).toBe('"a" {url} "b"')
    expect(Commands.templateTextOf('"{url}')).toBe('"{url}')
    expect(Commands.templateTextOf('  {url}  ')).toBe('{url}')
  })
})
