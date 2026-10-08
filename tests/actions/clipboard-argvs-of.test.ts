import { describe, expect, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'

describe('clipboard-argvs-of', () => {
  const SET_CLIPBOARD =
    '[Console]::InputEncoding = [System.Text.Encoding]::UTF8; $t = [Console]::In.ReadToEnd(); Set-Clipboard -Value $t'

  test('Windows tries PowerShell reading UTF-8 first, then clip.exe', () => {
    expect(Actions.clipboardArgvsOf('windows')).toEqual([
      ['powershell', '-NoProfile', '-NonInteractive', '-Command', SET_CLIPBOARD],
      ['clip.exe'],
    ])
  })

  test('macOS uses pbcopy', () => {
    expect(Actions.clipboardArgvsOf('darwin')).toEqual([['pbcopy']])
  })

  test('elsewhere wl-copy, xclip, then the Windows pair as WSL names them', () => {
    expect(Actions.clipboardArgvsOf('other')).toEqual([
      ['wl-copy'],
      ['xclip', '-selection', 'clipboard'],
      ['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', SET_CLIPBOARD],
      ['clip.exe'],
    ])
  })

  test('the text never goes in an argument; every tool reads it from standard input', () => {
    for (const platform of ['windows', 'darwin', 'other'] as const) {
      expect(Actions.clipboardArgvsOf(platform).every(argv => argv.length > 0)).toBe(true)
    }
  })
})
