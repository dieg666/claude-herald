import { describe, expect, mock, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Fixtures from '../fixtures'

describe('open-item', () => {
  const ITEM = Fixtures.itemAt('a')

  const PLATFORMS = [
    { name: 'Windows', os: 'Windows_NT', uname: '', argv: ['cmd', '/c', 'start', '', ITEM.url] },
    { name: 'macOS', os: undefined, uname: 'Darwin\n', argv: ['open', ITEM.url] },
    { name: 'Linux', os: undefined, uname: 'Linux\n', argv: ['xdg-open', ITEM.url] },
  ] as const

  for (const platform of PLATFORMS) {
    test(`on ${platform.name} runs ${platform.argv[0]} with the address`, async () => {
      const { host, env, programs, runs, toasts } = Fixtures.fakeHostOf()

      if (platform.os !== undefined) {
        env.OS = platform.os
      }

      programs.set('uname', { stdout: platform.uname })

      expect(await Actions.openItem(host, ITEM)).toBe(true)
      expect(runs.map(run => run.argv)).toEqual(
        platform.os === undefined ? [['uname', '-s'], platform.argv] : [platform.argv],
      )
      expect(toasts).toEqual([])
    })
  }

  test('a uname that cannot run means xdg-open', async () => {
    const { host, programs, runs, logs } = Fixtures.fakeHostOf()

    programs.set('uname', new Error('not found'))

    expect(await Actions.openItem(host, ITEM)).toBe(true)
    expect(runs.map(run => run.argv)).toEqual([
      ['uname', '-s'],
      ['xdg-open', ITEM.url],
    ])
    expect(logs).toEqual(['news: uname -s failed: not found'])
  })

  test('an address that is not http(s) runs nothing and toasts', async () => {
    for (const url of ['javascript:alert(1)', 'file:///etc/passwd', '/news/a', '-x https://a']) {
      const { host, runs, toasts } = Fixtures.fakeHostOf()

      expect(await Actions.openItem(host, { ...ITEM, url, title: 'Line\nbreak' })).toBe(false)
      expect(runs).toEqual([])
      expect(toasts).toEqual(['Not opened: "Line break" has no web address.'])
    }
  })

  test('an opener that fails or cannot start toasts the reason and logs it', async () => {
    const failed = Fixtures.fakeHostOf()

    failed.programs.set('xdg-open', { exitCode: 3, stderr: 'no browser\n' })

    expect(await Actions.openItem(failed.host, ITEM)).toBe(false)
    expect(failed.toasts).toEqual(['Could not open the link: xdg-open exited with 3: no browser'])
    expect(failed.logs).toEqual([
      `news: could not open ${ITEM.url}: xdg-open exited with 3: no browser`,
    ])

    const missing = Fixtures.fakeHostOf()

    missing.programs.set('xdg-open', new Error('ENOENT'))

    expect(await Actions.openItem(missing.host, ITEM)).toBe(false)
    expect(missing.toasts).toEqual(['Could not open the link: ENOENT'])
  })

  test('o in the band opens the selected item through env.get and process.run', async ($, on) => {
    const runs: (readonly string[])[] = []
    let os: string | undefined

    mock.clock(on)

    const { toasts, submitted } = Fixtures.bandOn(on, {
      sources: [Fixtures.sourceAt('src')],
      items: { src: Fixtures.datedItemsOf('src', 3) },
    })

    on('env.get', ($, e) => ({ value: e.name === 'OS' ? os : undefined }))
    on('process.run', ($, e) => {
      runs.push(e.argv)

      return {
        value: {
          exitCode: 0,
          stdout: e.argv[0] === 'uname' ? 'Linux\n' : '',
          stderr: '',
          isStdoutTruncated: false,
          isStderrTruncated: false,
        },
      }
    })

    await $.classic.SessionStart({ source: 'clear' })

    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({
        plugin: 'news',
        component: 'AbovePrompt',
        props: Fixtures.BAND_PROPS,
        surface,
      })

      os = undefined
      await ui.press({ key: 'open' })
      await ui.press({ key: 'down' })
      os = 'Windows_NT'
      await ui.press({ key: 'open' })
      await ui.unmount()
    }

    expect(runs).toEqual([
      ['uname', '-s'],
      ['xdg-open', 'https://example.com/src/1'],
      ['cmd', '/c', 'start', '', 'https://example.com/src/2'],
      ['uname', '-s'],
      ['xdg-open', 'https://example.com/src/2'],
      ['cmd', '/c', 'start', '', 'https://example.com/src/3'],
    ])
    expect([toasts, submitted]).toEqual([[], []])
  })
})
