import { describe, expect, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'

describe('opener-argv-of', () => {
  const URL = 'https://example.com/a'

  test('rundll32 on Windows, open on macOS, xdg-open detached through sh elsewhere', () => {
    expect(Actions.openerArgvOf('windows', URL)).toEqual([
      'rundll32',
      'url.dll,FileProtocolHandler',
      URL,
    ])
    expect(Actions.openerArgvOf('darwin', URL)).toEqual(['open', URL])
    expect(Actions.openerArgvOf('other', URL)).toEqual([
      'sh',
      '-c',
      'xdg-open "$1" >/dev/null 2>&1 &',
      'sh',
      URL,
    ])
  })

  test('the address is always one argument of its own, never part of a script', () => {
    const url = 'https://example.com/?a=1&b=$(id)`x`;%PATH%|^"'

    for (const platform of ['windows', 'darwin', 'other'] as const) {
      const argv = Actions.openerArgvOf(platform, url)

      expect(argv[argv.length - 1]).toBe(url)
      expect(argv.slice(0, -1).some(arg => arg.includes('example.com'))).toBe(false)
    }
  })
})
