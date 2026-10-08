import type { Platform } from './platform.js'

/**
 * PowerShell's clipboard write, reading standard input as UTF-8 so non-ASCII text survives (clip.exe reads the OEM code page).
 */
const SET_CLIPBOARD =
  '[Console]::InputEncoding = [System.Text.Encoding]::UTF8; $t = [Console]::In.ReadToEnd(); Set-Clipboard -Value $t'

/**
 * The PowerShell call that copies standard input, under a program name.
 *
 * @param program `powershell` on Windows, `powershell.exe` from WSL
 */
function powershellOf(program: string): string[] {
  return [program, '-NoProfile', '-NonInteractive', '-Command', SET_CLIPBOARD]
}

/**
 * The clipboard tools to try in order, each reading the text on standard input: PowerShell then `clip.exe` on Windows, `pbcopy` on macOS, else `wl-copy`, `xclip -selection clipboard`, then the Windows pair as WSL reaches them.
 *
 * @param platform where the session runs
 */
export function clipboardArgvsOf(platform: Platform): string[][] {
  if (platform === 'windows') {
    return [powershellOf('powershell'), ['clip.exe']]
  }

  if (platform === 'darwin') {
    return [['pbcopy']]
  }

  return [
    ['wl-copy'],
    ['xclip', '-selection', 'clipboard'],
    powershellOf('powershell.exe'),
    ['clip.exe'],
  ]
}
