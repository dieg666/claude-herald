import { describe, expect, test } from 'claude-code/testing'

import Pane from '../../hooks/pane'

describe('fit-start-columns', () => {
  test('a line that fits is kept; a longer one loses its start behind an ellipsis', () => {
    expect(Pane.fitStartColumns('@scope/name', 11)).toBe('@scope/name')
    expect(Pane.fitStartColumns('@fortawesome/fontawesome-svg-core', 22)).toBe(
      '…/fontawesome-svg-core',
    )
    expect(Pane.fitStartColumns('a漢字', 4)).toBe('…字')
    expect(Pane.fitStartColumns('abc', 0)).toBe('')
  })
})
