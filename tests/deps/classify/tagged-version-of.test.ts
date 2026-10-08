import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'

/** A tag or title and what it names (undefined for no version). */
const TAGS: readonly (readonly [string, Classify.TaggedVersion | undefined])[] = [
  ['v1.2.3', { version: 'v1.2.3' }],
  ['1.2.3', { version: '1.2.3' }],
  ['v2.0.0-rc.1+build.7', { version: 'v2.0.0-rc.1+build.7' }],
  ['v1.0.0-2', { version: 'v1.0.0-2' }],
  ['1.2.3rc1', { version: '1.2.3rc1' }],
  ['1!2.0.post1', { version: '1!2.0.post1' }],
  ['5.3.31.RELEASE', { version: '5.3.31.RELEASE' }],
  ['2025-11-25-RC', { version: '2025-11-25-RC' }],
  ['release-1.2', { version: '1.2' }],
  ['release_1_2_0', { version: '1.2.0' }],
  ['version-2.0.0', { version: '2.0.0' }],
  ['release/1.2', { version: '1.2' }],
  ['Release 1.2.3: notes', { version: '1.2.3' }],
  ['Version 4.0 is out', { version: '4.0' }],
  ['v2.1.293', { version: 'v2.1.293' }],
  ['2026-07-28 RC', { version: '2026-07-28' }],
  ['pkg@1.2.3', { version: '1.2.3', package: 'pkg' }],
  ['@scope/pkg@1.2.3', { version: '1.2.3', package: '@scope/pkg' }],
  ['@scope/pkg@1.2.3: changes', { version: '1.2.3', package: '@scope/pkg' }],
  ['go/v1.2.3', { version: 'v1.2.3', package: 'go' }],
  ['service/s3/v1.40.0', { version: 'v1.40.0', package: 'service/s3' }],
  ['tokio-macros-v2.2.0', { version: 'v2.2.0', package: 'tokio-macros' }],
  ['tokio-1.35.0', { version: '1.35.0', package: 'tokio' }],
  ['jackson-databind-2.15.0', { version: '2.15.0', package: 'jackson-databind' }],
  ['curl-8_4_0', { version: '8.4.0', package: 'curl' }],
  ['hotfix-1.2.3', { version: '1.2.3' }],
  ['rc-2.0.0', { version: '2.0.0' }],
  ['beta_2.0.0', { version: '2.0.0' }],
  ['alpha-0.1.0', { version: '0.1.0' }],
  ['patch-1.0.1', { version: '1.0.1' }],
  ['final-3.0', { version: '3.0' }],
  ['latest-1.0', { version: '1.0' }],
  ['stable-1.0', { version: '1.0' }],
  ['Weekly update', undefined],
  ['nightly', undefined],
  ['', undefined],
]

describe('tagged-version-of', () => {
  test('tags and titles name a version, and a package in monorepo forms', () => {
    for (const [text, tagged] of TAGS) {
      expect(Classify.taggedVersionOf(text), text).toEqual(tagged)
    }
  })

  test('in a title only a version with a dot, a v prefix or a date counts', () => {
    expect(Classify.taggedVersionOf('Weekly update 12', true)).toBeUndefined()
    expect(Classify.taggedVersionOf('Weekly update 12')).toEqual({ version: '12' })
    expect(Classify.taggedVersionOf('Build 2024 notes', true)).toBeUndefined()
    expect(Classify.taggedVersionOf('12 fixes in 1.4.0', true)).toEqual({ version: '1.4.0' })
    expect(Classify.taggedVersionOf('v12', true)).toEqual({ version: 'v12' })
    expect(Classify.taggedVersionOf('2025-11-25 spec', true)).toEqual({ version: '2025-11-25' })
    expect(Classify.taggedVersionOf('pkg@3 is out', true)).toBeUndefined()
  })

  test('a version glued to a word is not one (Python3.12)', () => {
    expect(Classify.taggedVersionOf('Python3.12 support')).toBeUndefined()
  })
})
