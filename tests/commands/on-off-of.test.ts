import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('on-off-of', () => {
  test('on and off in any case and spacing; anything else is none', () => {
    expect([' ON ', 'off', 'Off'].map(Commands.onOffOf)).toEqual([true, false, false])
    expect(['yes', '', 'onn', '1'].map(Commands.onOffOf)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })
})
