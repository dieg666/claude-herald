import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('deps-usage-text-of', () => {
  test('the listing, each subcommand in order and help, aligned', () => {
    const text = Commands.depsUsageTextOf({
      on: {
        usage: 'on',
        summary: 'turn on',
        needsArgument: false,
        run: async () => ({ text: '' }),
      },
      cap: {
        usage: 'cap <n>',
        summary: 'set',
        needsArgument: true,
        run: async () => ({ text: '' }),
      },
    })

    expect(text).toBe(
      [
        'Usage:',
        "  /news deps          this project's stack: settings, followed packages and their release feeds",
        '  /news deps on       turn on',
        '  /news deps cap <n>  set',
        '  /news deps help     show this list',
      ].join('\n'),
    )
  })
})
