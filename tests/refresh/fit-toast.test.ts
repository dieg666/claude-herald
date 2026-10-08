import { describe, expect, test } from 'claude-code/testing'

import Refresh from '../../hooks/refresh'

describe('fit-toast', () => {
  test('a short toast is kept; a long one is cut at a word to the cap with an ellipsis', () => {
    expect(Refresh.fitToast('1 new: a')).toBe('1 new: a')

    const cut = Refresh.fitToast(`2 new: ${'word '.repeat(60)}`)

    expect(cut.length <= Refresh.REFRESH_LIMITS.toastChars).toBe(true)
    expect(cut).toMatch(/word…$/)
  })
})
