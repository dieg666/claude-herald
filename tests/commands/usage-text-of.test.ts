import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('usage-text-of', () => {
  test("a subcommand's other forms each take a line of their own below it, aligned with the rest", () => {
    const run = async () => ({ text: '' })
    const text = Commands.usageTextOf({
      one: {
        usage: 'one <x>',
        summary: 'does one',
        forms: [{ usage: 'one other <y>', summary: 'does the other' }],
        needsArgument: true,
        run,
      },
      two: { usage: 'two', summary: 'does two', needsArgument: false, run },
    })

    expect(text.split('\n')).toEqual([
      'Usage:',
      '  /herald                open the Herald pane, or list the latest items where no pane is drawn',
      '  /herald one <x>        does one',
      '  /herald one other <y>  does the other',
      '  /herald two            does two',
      '  /herald help           show this list',
    ])
  })

  test('the help lists both forms of band, one after the other, then pane', () => {
    const lines = Commands.usageTextOf(Commands.SUBCOMMANDS).split('\n')
    const at = lines.findIndex(line => line.startsWith('  /herald band on|off <name> '))

    expect(at).toBeGreaterThan(0)
    expect(lines[at]).toMatch(/ show or hide a source in the band, /)
    expect(lines[at + 1]).toMatch(
      /^ {2}\/herald band size <n> +items the band shows at once, 1 to 9 \(default 3\)$/,
    )
    expect(lines[at + 2]).toMatch(/^ {2}\/herald pane on\|off <name> /)
  })
})
