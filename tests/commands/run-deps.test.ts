import { describe, expect, mock, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Fixtures from '../fixtures'

describe('run-deps', () => {
  const REPO = { '.git': { isDir: true as const } }

  const USAGES = [
    '/news deps ',
    ...Object.values(Commands.DEPS_SUBCOMMANDS).map(subcommand => `/news deps ${subcommand.usage}`),
    '/news deps help',
  ]

  test('/news deps help lists every deps subcommand; /news help lists deps on one line pointing to it', async ($, on) => {
    Fixtures.storeOn(on, { sources: [] })

    const { text } = await $.command.run(Fixtures.newsOf('deps help'))

    expect(text?.startsWith('Usage:\n')).toBe(true)

    for (const usage of USAGES) {
      expect(text).toContain(usage)
    }

    expect(Object.keys(Commands.DEPS_SUBCOMMANDS)).toEqual([
      'on',
      'off',
      'rescan',
      'ignore',
      'unignore',
      'add',
      'map',
      'dev',
      'level',
      'toast',
      'cap',
      'template',
      'filter',
    ])

    const news = (await $.command.run(Fixtures.newsOf('help'))).text ?? ''

    expect(news.split('\n').filter(line => line.includes('/news deps'))).toEqual([
      expect.stringMatching(
        /^ {2}\/news deps +your stack's releases; \/news deps help lists its subcommands$/,
      ),
    ])
  })

  test('an unknown deps subcommand answers the deps usage, saving nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    for (const args of ['frobnicate', 'constructor', '__proto__', 'list']) {
      const { text } = await $.command.run(Fixtures.newsOf(`deps ${args}`))

      expect(text?.startsWith(`/news deps has no "${args}" subcommand.\n\nUsage:\n`)).toBe(true)
      expect(text).toContain('/news deps help')
    }

    expect([...stored.keys()]).toEqual(['sources'])
  })

  test('a deps subcommand missing its argument answers its own usage line', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    for (const name of Object.keys(Commands.DEPS_SUBCOMMANDS).filter(
      key => Commands.DEPS_SUBCOMMANDS[key as keyof typeof Commands.DEPS_SUBCOMMANDS].needsArgument,
    )) {
      const { text } = await $.command.run(Fixtures.newsOf(`deps ${name}  ""`))
      const usage = Commands.DEPS_USAGES[name as keyof typeof Commands.DEPS_USAGES]

      expect(text).toBe(`/news deps ${name}: the argument is missing.\nUsage: /news deps ${usage}`)
    }

    expect([...stored.keys()]).toEqual(['sources'])
  })

  test('subcommand names ignore case', async ($, on) => {
    const stored = Fixtures.storeOn(on, { sources: [] })

    Fixtures.fsOn(on, REPO)

    expect((await $.command.run(Fixtures.newsOf('DEPS Cap 9'))).text).toMatch(
      /^\/repo follows at most 9 /,
    )
    expect(stored.get('deps')).toMatchObject({ '/repo': { settings: { cap: 9 } } })
  })

  test('every deps subcommand answers a non-empty text, success or refusal, in a repository, outside one and at a filesystem root', async ($, on) => {
    mock.clock(on)
    Fixtures.storeOn(on, { sources: [] })
    Fixtures.webOn(on, new Map())
    Fixtures.logsOn(on)

    const root = { current: '/repo' }

    on('session.root', () => ({ value: root.current }))
    on('fs.list', ($, e) =>
      e.path === '/repo'
        ? { value: [{ name: '.git', kind: 'dir', size: 0, mtimeMs: 0, isLink: false }] }
        : { value: [] },
    )

    for (const where of ['/repo', '/work', '/']) {
      root.current = where

      for (const args of [
        '',
        'help',
        'on',
        'on now',
        'off',
        'off',
        'on',
        'rescan',
        'rescan now',
        'ignore npm:lodash',
        'ignore lodash',
        'unignore npm:lodash',
        'unignore npm:lodash',
        'add npm:zod',
        'add zod',
        'add owner/repo',
        'map npm:zod colinhacks/zod',
        'map npm:zod nowhere',
        'map zod',
        'dev on',
        'dev maybe',
        'level Minor+',
        'level patch',
        'toast off',
        'toast loud',
        'cap 7',
        'cap 0',
        'template {pkg} {new}',
        'template {title}',
        'filter react',
        'filter',
        `filter ${'x'.repeat(101)}`,
        'whatever',
      ]) {
        const { text } = await $.command.run(Fixtures.newsOf(`deps ${args}`))

        expect(typeof text === 'string' && text.trim() !== '', `${where}: /news deps ${args}`).toBe(
          true,
        )
      }
    }
  })
})
