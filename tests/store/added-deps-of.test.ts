import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('added-deps-of', () => {
  test('keeps dependencies once per ecosystem and name, the first, dropping anything else', () => {
    const zod = Fixtures.depAt('zod', { manifestPath: '' })

    expect(
      Store.addedDepsOf([
        zod,
        { ...zod, versionInUse: '9' },
        Fixtures.depAt('zod', { ecosystem: 'pypi', manifestPath: '' }),
        { name: 'broken' },
        'npm:x',
      ]),
    ).toEqual([zod, Fixtures.depAt('zod', { ecosystem: 'pypi', manifestPath: '' })])
  })

  test('a value that is not a list reads as none; a long list is cut at the most kept', () => {
    expect(Store.addedDepsOf('npm:zod')).toEqual([])
    expect(
      Store.addedDepsOf(
        Array.from({ length: Store.DEPS_LIST_MAX + 1 }, (_, i) => Fixtures.depAt(`p${i}`)),
      ).length,
    ).toBe(Store.DEPS_LIST_MAX)
  })
})
