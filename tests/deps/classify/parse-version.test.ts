import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'

describe('parse-version', () => {
  test('semver: a v prefix and build metadata are dropped, pre-release identifiers kept in order', () => {
    expect(Classify.parseVersion('v2.0.0-rc.1+build.5')).toEqual({
      epoch: 0,
      release: [2, 0, 0],
      qualifiers: [{ word: 'rc', rank: -2 }, 1],
    })
    expect(Classify.parseVersion('V1.2.3')).toEqual(Classify.parseVersion('1.2.3'))
  })

  test('PEP 440: epoch, pre, post and dev parts, a local label ignored', () => {
    expect(Classify.parseVersion('1!2.0rc1.post2.dev3+ubuntu.1', 'pypi')).toEqual({
      epoch: 1,
      release: [2, 0],
      qualifiers: [
        { word: 'rc', rank: -2 },
        1,
        { word: 'post', rank: 1 },
        2,
        { word: 'dev', rank: -6 },
        3,
      ],
    })
  })

  test('a bare number after the release is a post release for PyPI and Maven, a pre-release elsewhere', () => {
    expect(Classify.parseVersion('1.0-1', 'pypi')?.qualifiers).toEqual([
      { word: 'post', rank: 1 },
      1,
    ])
    expect(Classify.parseVersion('1.0-1', 'maven')?.qualifiers).toEqual([
      { word: 'post', rank: 1 },
      1,
    ])
    expect(Classify.parseVersion('1.0.0-1', 'npm')?.qualifiers).toEqual([1])
  })

  test('calendar dates read as year, month and day', () => {
    expect(Classify.parseVersion('2025-11-25-RC')).toEqual({
      epoch: 0,
      release: [2025, 11, 25],
      qualifiers: [{ word: 'rc', rank: -2 }],
    })
    expect(Classify.parseVersion('2024.10.1')?.release).toEqual([2024, 10, 1])
  })

  test('Maven final words vanish, an unknown word sorts after the final release for Maven only', () => {
    expect(Classify.parseVersion('5.3.31.RELEASE', 'maven')?.qualifiers).toEqual([])
    expect(Classify.parseVersion('6.4.0.Final', 'maven')?.qualifiers).toEqual([])
    expect(Classify.parseVersion('32.1.3-jre', 'maven')?.qualifiers).toEqual([
      { word: 'jre', rank: 2 },
    ])
    expect(Classify.parseVersion('1.0.0-next.1', 'npm')?.qualifiers).toEqual([
      { word: 'next', rank: -5 },
      1,
    ])
  })

  test('a word that is an Object prototype member has the unknown rank', () => {
    expect(Classify.parseVersion('1.0-constructor')?.qualifiers).toEqual([
      { word: 'constructor', rank: -5 },
    ])
  })

  test('text that does not start with a number, or holds other characters, is no version', () => {
    for (const text of ['', 'latest', 'v', 'next', '^1.2.3', '1.2.3 beta', 'abc1.2', '1.2/3']) {
      expect(Classify.parseVersion(text)).toBeUndefined()
    }
  })
})
