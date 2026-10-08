import { describe, expect, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'

describe('clipboard-argvs-of', () => {
  test('clip.exe on Windows, pbcopy on macOS, else wl-copy, xclip, then clip.exe', () => {
    expect(Actions.clipboardArgvsOf('windows')).toEqual([['clip.exe']])
    expect(Actions.clipboardArgvsOf('darwin')).toEqual([['pbcopy']])
    expect(Actions.clipboardArgvsOf('other')).toEqual([
      ['wl-copy'],
      ['xclip', '-selection', 'clipboard'],
      ['clip.exe'],
    ])
  })
})
