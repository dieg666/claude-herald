import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'

describe('version-change-of', () => {
  test('split at the first dot-separated part that differs', () => {
    expect(Stack.versionChangeOf('25.0.1', '30.1.2')).toEqual({ same: '', changed: '30.1.2' })
    expect(Stack.versionChangeOf('7.1.0', '7.3.1')).toEqual({ same: '7.', changed: '3.1' })
    expect(Stack.versionChangeOf('4.17.20', '4.17.21')).toEqual({ same: '4.17.', changed: '21' })
    expect(Stack.versionChangeOf('0.3.0', '0.4.0')).toEqual({ same: '0.', changed: '4.0' })
    expect(Stack.versionChangeOf('15.0.0', '16.0.0-rc.1')).toEqual({
      same: '',
      changed: '16.0.0-rc.1',
    })
  })

  test('all of it changed without a version in use or when the new one is a shorter prefix; nothing when it is the same', () => {
    expect(Stack.versionChangeOf(undefined, '2.0.0')).toEqual({ same: '', changed: '2.0.0' })
    expect(Stack.versionChangeOf('2.0.0', '2.0.0')).toEqual({ same: '2.0.0', changed: '' })
    expect(Stack.versionChangeOf('1.2.0', '1.2')).toEqual({ same: '', changed: '1.2' })
    expect(Stack.versionChangeOf('1.2', '1.2.1')).toEqual({ same: '1.2.', changed: '1' })
  })

  test('a leading v on one side only is ignored, kept in the part drawn unchanged', () => {
    expect(Stack.versionChangeOf('1.0.0', 'v1.0.1')).toEqual({ same: 'v1.0.', changed: '1' })
    expect(Stack.versionChangeOf('v1.0.0', '1.0.1')).toEqual({ same: '1.0.', changed: '1' })
    expect(Stack.versionChangeOf('1.0.0', 'v2.0.0')).toEqual({ same: 'v', changed: '2.0.0' })
    expect(Stack.versionChangeOf('v1.2.0', 'v1.2.0')).toEqual({ same: 'v1.2.0', changed: '' })
  })
})
