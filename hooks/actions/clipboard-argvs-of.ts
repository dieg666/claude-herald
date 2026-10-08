import type { Platform } from './platform.js'

/**
 * The clipboard tools to try in order, each reading the text on standard input: `clip.exe` on Windows, `pbcopy` on macOS, else `wl-copy`, `xclip -selection clipboard`, then `clip.exe` (WSL).
 *
 * @param platform where the session runs
 */
export function clipboardArgvsOf(platform: Platform): string[][] {
  if (platform === 'windows') {
    return [['clip.exe']]
  }

  if (platform === 'darwin') {
    return [['pbcopy']]
  }

  return [['wl-copy'], ['xclip', '-selection', 'clipboard'], ['clip.exe']]
}
