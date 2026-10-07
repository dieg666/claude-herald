import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('join-path', () => {
  test("joins a relative path in the root's own separator", () => {
    expect(Detect.joinPath('/repo', 'a/package.json')).toBe('/repo/a/package.json')
    expect(Detect.joinPath('/', 'go.mod')).toBe('/go.mod')
    expect(Detect.joinPath('C:\\code', 'a/b.csproj')).toBe('C:\\code\\a\\b.csproj')
    expect(Detect.joinPath('/repo', '')).toBe('/repo')
  })
})
