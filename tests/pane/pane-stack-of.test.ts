import { describe, expect, test } from 'claude-code/testing'

import type { StackState } from '../../types/index.js'
import Defaults from '../../hooks/defaults'
import Pane from '../../hooks/pane'
import Fixtures from '../fixtures'

describe('pane-stack-of', () => {
  const STATE: StackState = {
    root: '/repo',
    settings: { ...Defaults.DEFAULT_DEPS_SETTINGS },
    items: Fixtures.STACK_SAMPLE,
    filter: 're',
  }

  test('the items shown at the project level, the filter and the packages expanded', () => {
    expect(Pane.paneStackOf(STATE)).toEqual({
      items: Fixtures.STACK_SAMPLE.filter(item =>
        ['react', 'vite', 'requests', 'zod'].includes(item.release.name),
      ),
      filter: 're',
      expanded: [],
    })
    expect(Pane.paneStackOf({ ...STATE, expanded: ['npm:react'] })?.expanded).toEqual(['npm:react'])
  })

  test('no stack tab before the project is known or while its stack is off', () => {
    expect(Pane.paneStackOf({ ...STATE, root: null })).toBeUndefined()
    expect(
      Pane.paneStackOf({ ...STATE, settings: { ...STATE.settings, isEnabled: false } }),
    ).toBeUndefined()
  })
})
