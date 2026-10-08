import { describe, expect, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'

describe('opener-argv-of', () => {
  const URL = 'https://example.com/a'

  test('cmd start on Windows, open on macOS, xdg-open elsewhere', () => {
    expect(Actions.openerArgvOf('windows', URL)).toEqual(['cmd', '/c', 'start', '', URL])
    expect(Actions.openerArgvOf('darwin', URL)).toEqual(['open', URL])
    expect(Actions.openerArgvOf('other', URL)).toEqual(['xdg-open', URL])
  })

  test("on Windows cmd's operators in the address are escaped, so start receives it whole", () => {
    expect(Actions.openerArgvOf('windows', 'https://example.com/?a=1&b=(2)|^<x>')).toEqual([
      'cmd',
      '/c',
      'start',
      '',
      'https://example.com/?a=1^&b=^(2^)^|^^^<x^>',
    ])
    expect(Actions.openerArgvOf('other', 'https://example.com/?a=1&b=2')).toEqual([
      'xdg-open',
      'https://example.com/?a=1&b=2',
    ])
  })
})
