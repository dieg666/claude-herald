import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('display-title-of', () => {
  test('a title that is only a version leads with the source name', () => {
    expect(Items.displayTitleOf('v0.3.293', 'Claude Agent SDK (TS)')).toBe(
      'Claude Agent SDK (TS) v0.3.293',
    )
    expect(Items.displayTitleOf('2026-07-28 RC', 'Dated')).toBe('Dated 2026-07-28 RC')
    expect(Items.displayTitleOf('Release 7.3.1', 'Lib')).toBe('Lib Release 7.3.1')
  })

  test('a normal headline is left alone', () => {
    expect(Items.displayTitleOf('Claude Code v2.1.293 adds things', 'Claude Code')).toBe(
      'Claude Code v2.1.293 adds things',
    )
    expect(Items.displayTitleOf('@scope/pkg@1.2.3', 'Lib')).toBe('@scope/pkg@1.2.3')
    expect(Items.displayTitleOf('v', 'Lib')).toBe('v')
  })

  test('a gone or blank source name leaves the title as it is', () => {
    expect(Items.displayTitleOf('v1.2.3', undefined)).toBe('v1.2.3')
    expect(Items.displayTitleOf('v1.2.3', '  ')).toBe('v1.2.3')
  })
})
