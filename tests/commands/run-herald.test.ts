import { describe, expect, mock, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Fixtures from '../fixtures'

describe('run-herald', () => {
  const USAGES = [
    '/herald ',
    ...Object.values(Commands.SUBCOMMANDS).map(subcommand => `/herald ${subcommand.usage}`),
    '/herald help',
  ]

  const expectUsage = (text: string | undefined) => {
    for (const usage of USAGES) {
      expect(text).toContain(usage)
    }
  }

  test('the usage lists /herald, every subcommand and help', async ($, on) => {
    Fixtures.storeOn(on, { sources: [] })

    const { text } = await $.command.run(Fixtures.heraldOf('help'))

    expect(text?.startsWith('Usage:\n')).toBe(true)
    expectUsage(text)
    expect(Object.keys(Commands.SUBCOMMANDS)).toEqual([
      'add',
      'add-page',
      'remove',
      'list',
      'enable',
      'disable',
      'interval',
      'rotate',
      'lang',
      'template',
      'reset',
      'deps',
    ])
  })

  test('an unknown subcommand answers the usage, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    for (const args of ['frobnicate', 'constructor', '__proto__', '"add"']) {
      const { text } = await $.command.run(Fixtures.heraldOf(args))

      expect(text?.startsWith(`/herald has no "${args}" subcommand.\n\n`)).toBe(true)
      expectUsage(text)
    }

    expect([...stored.keys()]).toEqual(['sources'])
  })

  test('a subcommand missing its argument answers the usage', async ($, on) => {
    Fixtures.storeOn(on, { sources: [] })

    for (const name of ['add', 'add-page', 'remove', 'enable', 'disable', 'interval', 'rotate']) {
      const { text } = await $.command.run(Fixtures.heraldOf(`${name}   `))

      expect(text).toMatch(new RegExp(`^/herald ${name} .*: the argument is missing\\.\\n\\n`))
      expectUsage(text)
    }

    for (const name of ['lang', 'template']) {
      expectUsage((await $.command.run(Fixtures.heraldOf(`${name} ""`))).text)
    }
  })

  test('subcommand names ignore case and surrounding spaces', async ($, on) => {
    Fixtures.storeOn(on, { sources: [Fixtures.sourceAt('one')] })

    expect((await $.command.run(Fixtures.heraldOf('  LIST  '))).text).toMatch(
      /^1 of 1 sources enabled:/,
    )
  })

  test('a failure inside a subcommand answers text and logs to debug', async ($, on) => {
    const logs = Fixtures.logsOn(on)

    on('store.get', () => ({ deny: 'store unavailable' }))

    const { text } = await $.command.run(Fixtures.heraldOf('list'))

    expect(text).toMatch(/^\/herald list failed: .*store unavailable/)
    expect(logs).toEqual([expect.stringMatching(/^debug: herald: \/herald list: /)])
  })

  test('every subcommand answers a non-empty text, success or refusal', async ($, on) => {
    mock.clock(on)
    Fixtures.storeOn(on, { sources: [Fixtures.sourceAt('one')] })
    Fixtures.webOn(on, new Map())
    Fixtures.paneOn(on, [])
    Fixtures.logsOn(on)
    on('model.complete', () => ({ deny: 'offline' }))

    for (const args of [
      '',
      'help',
      'add https://example.org/x.xml',
      'add-page https://example.org/x',
      'remove nope',
      'list',
      'enable nope',
      'disable one',
      'interval 7',
      'interval x',
      'rotate 30',
      'rotate 1',
      'lang es',
      'lang english',
      'template {title}',
      'template {nope}',
      'reset',
      'whatever',
    ]) {
      const { text } = await $.command.run(Fixtures.heraldOf(args))

      expect(typeof text === 'string' && text.trim() !== '', `/herald ${args}`).toBe(true)
    }
  })
})
