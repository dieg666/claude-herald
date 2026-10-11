import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Stack from '../../hooks/deps/stack'
import Fixtures from '../fixtures'

describe('run-pasted-command', () => {
  const run = (command: string) => {
    const fake = Fixtures.fakeHostOf({ sources: [Fixtures.sourceAt('one')] })

    return Commands.runPastedCommand(fake.host, command, Stack.stackLoopOf(), 10).then(answer => ({
      answer,
      fake,
    }))
  }

  test('a subcommand runs as it would alone, follow-ups kept, headed by /herald and its arguments', async () => {
    const { answer, fake } = await run('/HERALD   disable one')

    expect(answer).toEqual({
      heading: '/herald disable one',
      reply: {
        text: 'Disabled "one"; it is kept but no longer fetched or shown.',
        resyncSummaries: true,
      },
    })
    expect(fake.stored.get('sources')).toEqual([Fixtures.sourceAt('one', { isEnabled: false })])
  })

  test('a first command without /herald gets it in its heading', async () => {
    expect((await run('list')).answer.heading).toBe('/herald list')
  })

  test('a bare /herald, typed or left blank, opens no pane and says so', async () => {
    for (const command of ['/herald', '']) {
      const { answer, fake } = await run(command)

      expect(answer).toEqual({
        heading: '/herald',
        reply: {
          text: '/herald alone opens the pane, which it does not do among several commands; run it on its own.',
        },
      })
      expect(fake.opened).toEqual([])
    }
  })

  test('another slash command is headed as pasted and does not run', async () => {
    const { answer, fake } = await run('/compact keep\nthe plan')

    expect(answer).toEqual({
      heading: '/compact keep\nthe plan',
      reply: { text: '/compact is not a /herald command, so it did not run.' },
    })
    expect(fake.sets).toEqual([])
  })
})
