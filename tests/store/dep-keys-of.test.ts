import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'

describe('dep-keys-of', () => {
  test('keeps keys with a known ecosystem and a name, trimmed, once each, in order', () => {
    expect(
      Store.depKeysOf([
        'npm:react',
        'pypi: requests ',
        'npm:react',
        'github:owner/repo',
        'maven:org.slf4j:slf4j-api',
        'cobol:x',
        'npm:',
        ':react',
        'react',
        7,
        null,
      ]),
    ).toEqual(['npm:react', 'pypi:requests', 'github:owner/repo', 'maven:org.slf4j:slf4j-api'])
  })

  test('a value that is not a list reads as none; a long list is cut at the most kept', () => {
    expect(Store.depKeysOf({ 0: 'npm:a' })).toEqual([])
    expect(
      Store.depKeysOf(Array.from({ length: Store.DEPS_LIST_MAX + 5 }, (_, i) => `npm:p${i}`))
        .length,
    ).toBe(Store.DEPS_LIST_MAX)
  })
})
