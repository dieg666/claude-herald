import { describe, expect, test } from 'claude-code/testing'

import Refresh from '../../hooks/refresh'

describe('message-of', () => {
  test("an error's message, anything else as text, on one line", () => {
    expect(Refresh.messageOf(new Error('boom\n  at line 2'))).toBe('boom at line 2')
    expect(Refresh.messageOf('denied')).toBe('denied')
    expect(Refresh.messageOf(42)).toBe('42')
  })

  test('cuts a long message to 200 characters', () => {
    const text = Refresh.messageOf(new Error('x'.repeat(500)))

    expect(text.length).toBe(200)
    expect(text.endsWith('…')).toBe(true)
  })
})
