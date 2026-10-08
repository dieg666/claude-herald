import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('deps-refusal-of', () => {
  test('the reason, then the usage line of that subcommand', () => {
    expect(Commands.depsRefusalOf('cap', 'Too many.')).toEqual({
      text: 'Too many.\nUsage: /herald deps cap <1-500>',
    })
  })
})
