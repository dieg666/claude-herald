import { describe, expect, mock, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Fixtures from '../fixtures'

describe('copy-item', () => {
  const SOURCE = Fixtures.sourceAt('src', { name: 'Feed' })
  const ITEM = { ...Fixtures.itemAt('a'), title: 'Big\nnews' }
  const STORE = { sources: [SOURCE], settings: { template: 'See {title} at {url} ({source})' } }
  const TEXT = 'See Big news at https://example.com/a (Feed)'

  const hostWith = async () => {
    const fake = Fixtures.fakeHostOf(STORE)

    await fake.host.state.sources.update(() => [SOURCE])

    return fake
  }

  test('copies the filled template to the pressed surface and toasts', async () => {
    const { host, copies, runs, toasts } = await hostWith()

    expect(await Actions.copyItem(host, ITEM, 'desktop')).toBe(true)
    expect(copies).toEqual([{ text: TEXT, surface: 'desktop' }])
    expect(runs).toEqual([])
    expect(toasts).toEqual(['📋 Copied'])
  })

  test('when the surface copies nothing, the clipboard tools are tried in order with the text on stdin', async () => {
    const { host, copyResult, programs, runs, toasts } = await hostWith()

    copyResult.value = { isCopied: false, reason: 'no-clipboard' }
    programs.set('uname', { stdout: 'Linux\n' })
    programs.set('wl-copy', { exitCode: 1, stderr: 'no wayland' })

    expect(await Actions.copyItem(host, ITEM, 'terminal')).toBe(true)
    expect(runs).toEqual([
      { argv: ['uname', '-s'], init: { timeoutMs: 5000 } },
      { argv: ['wl-copy'], init: { stdin: TEXT, timeoutMs: 5000 } },
      { argv: ['xclip', '-selection', 'clipboard'], init: { stdin: TEXT, timeoutMs: 5000 } },
    ])
    expect(toasts).toEqual(['📋 Copied'])
  })

  test('the fallback is pbcopy on macOS, and on Windows PowerShell before clip.exe', async () => {
    const mac = await hostWith()

    mac.copyResult.value = { isCopied: false, reason: 'no-surface' }
    mac.programs.set('uname', { stdout: 'Darwin\n' })

    expect(await Actions.copyItem(mac.host, ITEM, 'terminal')).toBe(true)
    expect(mac.runs.map(run => run.argv)).toEqual([['uname', '-s'], ['pbcopy']])

    const windows = await hostWith()

    windows.copyResult.value = new Error('copy unavailable')
    windows.env.OS = 'Windows_NT'

    windows.programs.set('powershell', { exitCode: 1, stderr: 'Set-Clipboard not found' })

    expect(await Actions.copyItem(windows.host, ITEM, 'terminal')).toBe(true)
    expect(windows.runs.map(run => run.argv[0])).toEqual(['powershell', 'clip.exe'])
    expect(windows.runs.map(run => run.init?.stdin)).toEqual([TEXT, TEXT])
    expect(windows.toasts).toEqual(['📋 Copied'])
  })

  test('when every tool fails the last reason is toasted', async () => {
    const { host, copyResult, programs, toasts, logs } = await hostWith()

    copyResult.value = { isCopied: false, reason: 'no-clipboard' }
    programs.set('wl-copy', { exitCode: 1 })
    programs.set('xclip', new Error('ENOENT'))
    programs.set('powershell.exe', new Error('ENOENT'))
    programs.set('clip.exe', { exitCode: 127, stderr: 'not found' })

    expect(await Actions.copyItem(host, ITEM, 'terminal')).toBe(false)
    expect(toasts).toEqual(['Could not copy: clip.exe exited with 127: not found'])
    expect(logs).toEqual([
      'news: clipboard: wl-copy exited with 1',
      'news: clipboard: xclip: ENOENT',
      'news: clipboard: powershell.exe: ENOENT',
      'news: clipboard: clip.exe exited with 127: not found',
    ])
  })

  test('a copy a hook refused is not retried with a tool', async () => {
    const { host, copyResult, runs, toasts } = await hostWith()

    copyResult.value = { isCopied: false, reason: 'refused' }

    expect(await Actions.copyItem(host, ITEM, 'terminal')).toBe(false)
    expect(runs).toEqual([])
    expect(toasts).toEqual(['Not copied: the copy was refused.'])
  })

  test('c in the band copies through ui.copy on the surface pressed, never submitting a prompt', async ($, on) => {
    const copies: { text: string; surface?: string }[] = []

    mock.clock(on)

    const { toasts, submitted } = Fixtures.bandOn(on, {
      ...STORE,
      items: { src: Fixtures.datedItemsOf('src', 2) },
    })

    on('ui.copy', ($, e) => {
      copies.push({ text: e.text, ...(e.surface === undefined ? {} : { surface: e.surface }) })

      return { value: { isCopied: true } }
    })

    await $.classic.SessionStart({ source: 'clear' })

    for (const surface of ['terminal', 'desktop'] as const) {
      const ui = await $.ui.mount({
        plugin: 'news',
        component: 'AbovePrompt',
        props: Fixtures.BAND_PROPS,
        surface,
      })

      await ui.press({ key: 'copy' })
      await ui.unmount()
    }

    const text = 'See src 1 at https://example.com/src/1 (Feed)'

    expect(copies).toEqual([
      { text, surface: 'terminal' },
      { text, surface: 'desktop' },
    ])
    expect(toasts).toEqual(['📋 Copied', '📋 Copied'])
    expect(submitted).toEqual([])
  })

  test('c in the band falls back to process.run with stdin when ui.copy copies nothing', async ($, on) => {
    const runs: { argv: readonly string[]; stdin?: string }[] = []

    mock.clock(on)
    mock.env(on, {})

    const { toasts, submitted } = Fixtures.bandOn(on, {
      ...STORE,
      items: { src: Fixtures.datedItemsOf('src', 2) },
    })

    on('ui.copy', () => ({ value: { isCopied: false, reason: 'no-clipboard' } }))
    on('process.run', ($, e) => {
      runs.push({ argv: e.argv, ...(e.init?.stdin === undefined ? {} : { stdin: e.init.stdin }) })

      return {
        value: {
          exitCode: 0,
          stdout: e.argv[0] === 'uname' ? 'Darwin\n' : '',
          stderr: '',
          isStdoutTruncated: false,
          isStderrTruncated: false,
        },
      }
    })

    await $.classic.SessionStart({ source: 'clear' })

    const ui = await $.ui.mount({
      plugin: 'news',
      component: 'AbovePrompt',
      props: Fixtures.BAND_PROPS,
      surface: 'terminal',
    })

    await ui.press({ key: 'copy' })

    expect(runs).toEqual([
      { argv: ['uname', '-s'] },
      { argv: ['pbcopy'], stdin: 'See src 1 at https://example.com/src/1 (Feed)' },
    ])
    expect(toasts).toEqual(['📋 Copied'])
    expect(submitted).toEqual([])
  })
})
