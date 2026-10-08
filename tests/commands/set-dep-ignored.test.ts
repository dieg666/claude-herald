import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('set-dep-ignored', () => {
  const projectAt = (stored: ReadonlyMap<string, unknown>) =>
    Store.depsProjectOf(Store.depsProjectsOf(stored.get('deps'))['/repo'])

  const peeked = (text: string | undefined) =>
    JSON.parse(text ?? 'null') as { stack: { items: { release: { name: string } }[] } }

  const SAMPLE = Fixtures.STACK_SAMPLE

  test(
    'ignore takes a bare name, drops the package from the followed ones and from state at once; unignore takes it out of the list',
    { plugins: [Fixtures.STACK_PEEK] },
    async ($, on) => {
      const stored = Fixtures.storeOn(on, {
        sources: [],
        ...Fixtures.stackStoreOf(SAMPLE, { showLevel: 'all' }),
      })

      Fixtures.fsOn(on, Fixtures.stackTreeOf(SAMPLE))

      expect((await $.command.run(Fixtures.heraldOf('deps ignore react'))).text).toBe(
        'Ignoring npm:react in /repo: it is no longer followed, looked up or shown.',
      )
      expect(projectAt(stored).ignored).toEqual(['npm:react'])
      expect(projectAt(stored).dependencies.map(dependency => dependency.name)).not.toContain(
        'react',
      )

      const names = peeked((await $.command.run(Fixtures.PEEK_STACK)).text).stack.items.map(
        item => item.release.name,
      )

      expect(names).toEqual(['vite', 'lodash', 'requests', 'next', 'zod'])

      expect((await $.command.run(Fixtures.heraldOf('deps unignore react'))).text).toBe(
        'npm:react is no longer ignored in /repo; it is followed again when a manifest declares it or it was added.',
      )
      expect(projectAt(stored).ignored).toBeUndefined()
    },
  )

  test('ecosystem:name ignores a followed or added package, spelled as followed; a quoted name is read whole', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: [],
      deps: {
        '/repo': {
          dependencies: [
            Fixtures.depAt('Some-Package', { ecosystem: 'pypi', manifestPath: 'requirements.txt' }),
          ],
          added: [Fixtures.depAt("we'ird", { manifestPath: '' })],
        },
      },
    })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    await $.command.run(Fixtures.heraldOf('deps ignore PyPI:some-package'))
    await $.command.run(Fixtures.heraldOf(`deps ignore "npm:we'ird"`))

    expect(projectAt(stored).ignored).toEqual(['pypi:Some-Package', "npm:we'ird"])
  })

  test('a typed package neither followed nor added, or a name with spaces, is refused with the usage line', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: [],
      deps: { '/repo': { dependencies: [Fixtures.depAt('zod')] } },
    })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    const usage = '\nUsage: /herald deps ignore <package>'

    expect((await $.command.run(Fixtures.heraldOf('deps ignore npm:typo'))).text).toBe(
      `npm:typo is not followed or added in /repo; /herald deps lists the packages it follows.${usage}`,
    )

    for (const args of ['npm:zod extra words', '"npm:zod extra"']) {
      expect((await $.command.run(Fixtures.heraldOf(`deps ignore ${args}`))).text).toBe(
        `Name one package, without spaces.${usage}`,
      )
    }

    expect(projectAt(stored).ignored).toBeUndefined()
  })

  test('a bare name two ecosystems share, or none has, is refused with the usage line and saves nothing', async ($, on) => {
    const stored = Fixtures.storeOn(on, {
      sources: [],
      deps: {
        '/repo': {
          dependencies: [
            Fixtures.depAt('requests'),
            Fixtures.depAt('requests', { ecosystem: 'pypi', manifestPath: 'requirements.txt' }),
          ],
        },
      },
    })

    Fixtures.fsOn(on, { '.git': { isDir: true } })

    const before = JSON.stringify(stored.get('deps'))

    expect((await $.command.run(Fixtures.heraldOf('deps ignore requests'))).text).toBe(
      '"requests" names npm:requests and pypi:requests; write the one you mean.\nUsage: /herald deps ignore <package>',
    )
    expect((await $.command.run(Fixtures.heraldOf('deps ignore nope'))).text).toBe(
      'No package here is named "nope"; write it as <ecosystem>:<name>, e.g. npm:nope.\nUsage: /herald deps ignore <package>',
    )
    expect((await $.command.run(Fixtures.heraldOf('deps unignore requests'))).text).toBe(
      'No package here is named "requests"; write it as <ecosystem>:<name>, e.g. npm:requests.\nUsage: /herald deps unignore <package>',
    )
    expect((await $.command.run(Fixtures.heraldOf('deps unignore npm:requests'))).text).toBe(
      'npm:requests is not ignored in /repo.\nUsage: /herald deps unignore <package>',
    )
    expect(JSON.stringify(stored.get('deps'))).toBe(before)
  })

  test('ignoring twice is refused', async ($, on) => {
    Fixtures.storeOn(on, { sources: [], deps: { '/repo': { ignored: ['npm:react'] } } })
    Fixtures.fsOn(on, { '.git': { isDir: true } })

    expect((await $.command.run(Fixtures.heraldOf('deps ignore npm:react'))).text).toBe(
      'npm:react is already ignored in /repo.\nUsage: /herald deps ignore <package>',
    )
  })
})
