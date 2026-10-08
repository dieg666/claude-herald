import { describe, expect, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Defaults from '../../hooks/defaults'
import Fixtures from '../fixtures'

describe('deps-copy-text-of', () => {
  const [react] = Fixtures.STACK_SAMPLE

  test('the default deps template fills {pkg}, {current}, {new} and {url}', () => {
    expect(Actions.depsCopyTextOf(Defaults.DEFAULT_SETTINGS.depsTemplate, react!)).toBe(
      "We use react 18.2.0. react 19.0.0 is out: https://github.com/owner/react/releases/tag/v19.0.0\nCheck whether it affects this project and what we'd need to change.",
    )
  })

  test('an unknown version in use reads unknown; values are one line and filled once', () => {
    const item = Fixtures.stackItemAt('a{new}\nb', '2.0.0')

    expect(Actions.depsCopyTextOf('{pkg} {current} → {new}', item)).toBe('a{new} b unknown → 2.0.0')
  })
})
