import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('quoted-name-of', () => {
  test('a name with no space or quote stays bare', () => {
    expect(Commands.quotedNameOf('Blog')).toBe('Blog')
  })

  test('a name with spaces or quotes is quoted, double quotes first', () => {
    expect(Commands.quotedNameOf("Simon Willison's Weblog")).toBe(`"Simon Willison's Weblog"`)
    expect(Commands.quotedNameOf('The "Best" Blog')).toBe(`'The "Best" Blog'`)
  })

  test('the quoted form reads back the name, word splitting and all', () => {
    for (const name of [
      'Blog',
      "Simon Willison's Weblog",
      'The "Best" Blog',
      `He said "it's"`,
      "'90s music",
      '"Quoted" start',
      'AINews (smol.ai)',
    ]) {
      expect(Commands.argumentOf(Commands.quotedNameOf(name))).toBe(name)
    }
  })
})
