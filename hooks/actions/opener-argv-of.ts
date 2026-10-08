import type { Platform } from './platform.js'

/**
 * What cmd would read as an operator in an address; a caret makes each literal again.
 */
const CMD_OPERATORS = /[\^&|<>()]/g

/**
 * The program and arguments that open an http(s) address in the default browser: `cmd /c start "" <url>` on Windows, `open <url>` on macOS, `xdg-open <url>` elsewhere.
 *
 * @param platform where the session runs
 * @param url an absolute http(s) address, as `URL.href` spells it
 */
export function openerArgvOf(platform: Platform, url: string): string[] {
  if (platform === 'windows') {
    return ['cmd', '/c', 'start', '', url.replace(CMD_OPERATORS, '^$&')]
  }

  return [platform === 'darwin' ? 'open' : 'xdg-open', url]
}
