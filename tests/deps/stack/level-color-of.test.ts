import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('level-color-of', () => {
  test('major as error, minor as warning, patch as success, unknown uncolored; all theme keys', () => {
    const colors = (['major', 'minor', 'patch', 'unknown'] as const).map(Stack.levelColorOf)

    expect(colors).toEqual(['error', 'warning', 'success', undefined])
    expect(colors.every(color => color === undefined || Fixtures.THEME_KEYS.includes(color))).toBe(
      true,
    )
  })
})
