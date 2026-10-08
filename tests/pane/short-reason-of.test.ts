import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('short-reason-of', () => {
  test('one line, kept whole up to sixty characters', () => {
    expect(Pane.shortReasonOf('  HTTP\n503  ')).toBe('HTTP 503')
    expect(Pane.shortReasonOf('x'.repeat(60))).toBe('x'.repeat(60))
  })

  test("the engine's call prefixes are left out", () => {
    expect(Pane.shortReasonOf('fetch failed: herald: $.http.fetch: offline')).toBe(
      'fetch failed: offline',
    )
    expect(Pane.shortReasonOf('HTTP 404; fallback: fetch failed: herald: $.http.fetch: x')).toBe(
      'HTTP 404; fallback: fetch failed: x',
    )
    expect(
      Pane.shortReasonOf(
        'fetch failed: herald: $.http.fetch(http://127.0.0.1:8737/a.xml) failed: ECONNREFUSED: ECONNREFUSED: Unable to connect.',
      ),
    ).toBe('fetch failed: ECONNREFUSED: Unable to connect.')
  })

  test('web addresses are left out, with the space before what follows them', () => {
    expect(Pane.shortReasonOf('fetch failed: no page at https://example.com/a.xml')).toBe(
      'fetch failed: no page at',
    )
    expect(Pane.shortReasonOf('HTTP 301 to HTTP://other.example/x?y=1; fallback: HTTP 404')).toBe(
      'HTTP 301 to; fallback: HTTP 404',
    )
    expect(Pane.shortReasonOf('not a feed (http://x.test/feed) at all')).toBe('not a feed at all')
  })

  test('a longer reason is cut to sixty characters, the ellipsis included', () => {
    const cut = Pane.shortReasonOf(`fetch failed: ${'y'.repeat(100)}`)

    expect(cut.length).toBe(60)
    expect(cut.endsWith('…')).toBe(true)
  })
})
