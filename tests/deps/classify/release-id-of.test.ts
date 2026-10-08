import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'
import Fixtures from '../../fixtures'

describe('release-id-of', () => {
  test("the package key and the entry's guid, else its link, else its title", () => {
    const dep = Fixtures.depAt('acme')

    expect(Classify.releaseIdOf(dep, { guid: 'g', link: 'l', title: 't' })).toBe('npm:acme|g')
    expect(Classify.releaseIdOf(dep, { link: 'l', title: 't' })).toBe('npm:acme|l')
    expect(Classify.releaseIdOf(dep, { title: 't' })).toBe('npm:acme|t')
  })
})
