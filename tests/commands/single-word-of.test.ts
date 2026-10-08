import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('single-word-of', () => {
  test('exactly one word without whitespace, quotes removed', () => {
    expect(Commands.singleWordOf('  npm:zod ')).toBe('npm:zod')
    expect(Commands.singleWordOf(`"npm:we'ird"`)).toBe("npm:we'ird")
  })

  test('several words, a quoted word with spaces, or nothing is none', () => {
    for (const rest of ['npm:zod extra', '"npm:zod extra"', '', '""']) {
      expect(Commands.singleWordOf(rest)).toBeUndefined()
    }
  })
})
