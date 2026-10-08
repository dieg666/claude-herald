import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'
import type { Ecosystem } from '../../../types/index.js'

/** The version in use, a newer release, how far it is, and the ecosystem they parse as. */
const LEVELS: readonly (readonly [string, string, Classify.ReleaseLevel, Ecosystem])[] = [
  ['1.2.3', '1.2.4', 'patch', 'npm'],
  ['1.2.3', '1.3.0', 'minor', 'npm'],
  ['1.9.0', '1.10.0', 'minor', 'npm'],
  ['1.2.3', '2.0.0', 'major', 'npm'],
  ['1.9.0', '2.0.0-rc.1', 'major', 'npm'],
  ['2.0.0-rc.1', '2.0.0', 'patch', 'npm'],
  ['v1.11.0', 'v1.12.0', 'minor', 'pypi'],
  ['1.0', '1.0.post1', 'patch', 'pypi'],
  ['1.0', '1!0.1', 'major', 'pypi'],
  ['2024.10.1', '2025.1.0', 'major', 'pypi'],
  ['2024.10.1', '2024.11.0', 'minor', 'pypi'],
  ['2025-11-25', '2026-07-28', 'major', 'npm'],
  ['v1.5.0', 'v2.0.0', 'major', 'go'],
  ['1.0-SNAPSHOT', '1.0', 'patch', 'maven'],
  ['5.3.30.RELEASE', '5.3.31.RELEASE', 'patch', 'maven'],
  ['1.2.3', '1.2.3.1', 'patch', 'nuget'],
  ['1.2', '1.2.1', 'patch', 'npm'],
  // Below 1.0 the first non-zero part is the compatibility boundary.
  ['0.3.1', '0.4.0', 'major', 'npm'],
  ['0.3.1', '0.3.2', 'patch', 'npm'],
  ['0.3.290', '0.3.293', 'patch', 'npm'],
  ['0.3.1', '1.0.0', 'major', 'cargo'],
  ['0.0.3', '0.0.4', 'major', 'cargo'],
  ['v0.0.0-20210101000000-abcdef123456', 'v0.1.0', 'major', 'go'],
]

describe('level-of', () => {
  test('the first release part that changed decides, 0.x minors counting as major', () => {
    for (const [current, release, level, ecosystem] of LEVELS) {
      const from = Classify.parseVersion(current, ecosystem)
      const to = Classify.parseVersion(release, ecosystem)

      if (from === undefined || to === undefined) {
        throw new Error(`unparseable: ${current} or ${release}`)
      }

      expect(Classify.levelOf(from, to), `${current} -> ${release}`).toBe(level)
    }
  })
})
