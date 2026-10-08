import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('deps-subcommands', () => {
  test('one entry per usage, in the same order, each with its usage and a summary', () => {
    expect(Object.keys(Commands.DEPS_SUBCOMMANDS)).toEqual(Object.keys(Commands.DEPS_USAGES))

    for (const [name, subcommand] of Object.entries(Commands.DEPS_SUBCOMMANDS)) {
      expect(subcommand.usage).toBe(Commands.DEPS_USAGES[name as keyof typeof Commands.DEPS_USAGES])
      expect(subcommand.summary.trim() === '').toBe(false)
    }
  })

  test('only the subcommands that take nothing, or an optional text, run without an argument', () => {
    expect(
      Object.entries(Commands.DEPS_SUBCOMMANDS)
        .filter(([, subcommand]) => !subcommand.needsArgument)
        .map(([name]) => name),
    ).toEqual(['on', 'off', 'rescan', 'filter'])
  })
})
