import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'
import type { Ecosystem } from '../../../types/index.js'

/** Versions in ascending order, per scheme, each with the ecosystem it parses as. */
const ASCENDING: readonly (readonly [string, Ecosystem, readonly string[]])[] = [
  [
    'semver precedence, from the spec',
    'npm',
    [
      '1.0.0-alpha',
      '1.0.0-alpha.1',
      '1.0.0-alpha.beta',
      '1.0.0-beta',
      '1.0.0-beta.2',
      '1.0.0-beta.11',
      '1.0.0-rc.1',
      '1.0.0',
    ],
  ],
  ['semver numbers, not text', 'cargo', ['1.9.0', '1.10.0', '1.11.0', '2.0.0-rc.1', '2.0.0']],
  ['semver numeric pre-release first', 'npm', ['1.0.0-1', '1.0.0-alpha', '1.0.0']],
  [
    'PEP 440',
    'pypi',
    [
      '1.0.dev1',
      '1.0a1.dev1',
      '1.0a1',
      '1.0a1.post1',
      '1.0b1',
      '1.0rc1',
      '1.0',
      '1.0.post1.dev1',
      '1.0.post1',
      '1.1',
      '1!0.1',
    ],
  ],
  ['PEP 440 spellings', 'pypi', ['2.0alpha2', '2.0b1', '2.0c2', '2.0', '2.0-1', '2.0.post2']],
  ['calendar versions', 'pypi', ['2024.1.0', '2024.10.1', '2025.1.0']],
  ['dated versions', 'npm', ['2025-11-25-RC', '2025-11-25', '2026-07-28-RC', '2026-07-28']],
  [
    'Go majors and pseudo-versions',
    'go',
    ['v0.0.0-20210101000000-abcdef123456', 'v0.0.0', 'v0.9.1', 'v1.9.0', 'v2.0.0-beta.1', 'v2.0.0'],
  ],
  [
    'Maven qualifiers',
    'maven',
    ['1.0-alpha1', '1.0-beta2', '1.0-M1', '1.0-RC1', '1.0-SNAPSHOT', '1.0', '1.0-sp1', '1.0.1'],
  ],
  ['Maven snapshot of a candidate', 'maven', ['1.0-RC1-SNAPSHOT', '1.0-RC1']],
  ['RubyGems pre-releases', 'rubygems', ['7.1.0.beta1', '7.1.0.rc2', '7.1.0', '7.1.1']],
]

/** Spellings of one version. */
const EQUAL: readonly (readonly [string, string, Ecosystem])[] = [
  ['v1.2.3', '1.2.3', 'npm'],
  ['1.2.3+build.5', '1.2.3+other', 'npm'],
  ['1.0', '1.0.0', 'pypi'],
  ['1.0+local', '1.0', 'pypi'],
  ['5.3.31.RELEASE', '5.3.31', 'maven'],
  ['6.4.0.Final', '6.4.0', 'maven'],
  ['1.0-GA', '1.0', 'maven'],
  ['v1.12.0', '1.12.0', 'pypi'],
]

/**
 * The order of two written versions.
 *
 * @param a one version
 * @param b the other
 * @param ecosystem how they parse
 */
function orderOf(a: string, b: string, ecosystem: Ecosystem): number {
  const left = Classify.parseVersion(a, ecosystem)
  const right = Classify.parseVersion(b, ecosystem)

  if (left === undefined || right === undefined) {
    throw new Error(`unparseable: ${a} or ${b}`)
  }

  return Classify.compareVersions(left, right)
}

describe('compare-versions', () => {
  for (const [name, ecosystem, versions] of ASCENDING) {
    test(`${name}: every version is newer than every one before it`, () => {
      versions.forEach((newer, index) => {
        for (const older of versions.slice(0, index)) {
          expect(orderOf(older, newer, ecosystem), `${older} < ${newer}`).toBe(-1)
          expect(orderOf(newer, older, ecosystem), `${newer} > ${older}`).toBe(1)
        }
      })
    })
  }

  test('spellings of one version compare equal', () => {
    for (const [a, b, ecosystem] of EQUAL) {
      expect(orderOf(a, b, ecosystem), `${a} = ${b}`).toBe(0)
    }
  })

  test('a Maven classifier version sorts after the plain release, an npm pre-release before it', () => {
    expect(orderOf('32.1.3', '32.1.3-jre', 'maven')).toBe(-1)
    expect(orderOf('1.0.0', '1.0.0-next.1', 'npm')).toBe(1)
  })
})
