import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('parent-dir-of', () => {
  test('climbs one level, POSIX and Windows, stopping at a filesystem root', () => {
    expect(Detect.parentDirOf('/repo/packages/a')).toBe('/repo/packages')
    expect(Detect.parentDirOf('/repo/')).toBe('/')
    expect(Detect.parentDirOf('/')).toBeUndefined()
    expect(Detect.parentDirOf('C:\\code\\app')).toBe('C:\\code')
    expect(Detect.parentDirOf('C:\\code')).toBe('C:\\')
    expect(Detect.parentDirOf('C:\\')).toBeUndefined()
  })
})
