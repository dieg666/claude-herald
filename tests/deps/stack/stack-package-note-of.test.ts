import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-package-note-of', () => {
  const notes = () =>
    Object.fromEntries(
      Stack.stackPackagesOf([...Fixtures.STACK_RELEASES, Fixtures.STACK_SAMPLE[4]!]).map(pkg => [
        pkg.name,
        Stack.stackPackageNoteOf(pkg),
      ]),
    )

  test('flags name the release that brought them unless it is the newest; more than one release is counted', () => {
    expect(notes()).toEqual({
      'left-pad': '',
      astro: '',
      '@astrojs/node': 'security',
      jsdom: 'breaking in 30.0.0 · 3 releases',
      '@fortawesome/fontawesome-svg-core': '2 releases',
      lodash: '',
      requests: 'security',
      next: 'pre-release',
    })
  })

  test('security comes before breaking; a release without a version is named by its title', () => {
    const flagged = Fixtures.stackItemAt('a', '2.0.0', {
      breaking: true,
      security: true,
      title: 'Big\none',
    })
    const [pkg] = Stack.stackPackagesOf([
      Fixtures.stackItemAt('a', '3.0.0'),
      { ...flagged, release: { ...flagged.release, version: undefined } },
    ])

    expect(Stack.stackPackageNoteOf(pkg!)).toBe(
      'security in Big one · breaking in Big one · 2 releases',
    )
  })
})
