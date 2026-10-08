import type { Platform } from './platform.js'

/**
 * The program and arguments that open an http(s) address in the default browser: `rundll32 url.dll,FileProtocolHandler <url>` on Windows (no shell re-reads it), `open <url>` on macOS, elsewhere `xdg-open` detached through `sh` with its output dropped, so a browser that keeps the pipes open never holds the call; the address is always one argument of its own.
 *
 * @param platform where the session runs
 * @param url an absolute http(s) address, as `URL.href` spells it
 */
export function openerArgvOf(platform: Platform, url: string): string[] {
  if (platform === 'windows') {
    return ['rundll32', 'url.dll,FileProtocolHandler', url]
  }

  if (platform === 'darwin') {
    return ['open', url]
  }

  // The address reaches xdg-open as "$1", never spliced into the script.
  return ['sh', '-c', 'xdg-open "$1" >/dev/null 2>&1 &', 'sh', url]
}
