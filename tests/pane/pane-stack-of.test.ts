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

  test('the items shown at the project level, the filter, the packages expanded, the settings, how many the level hides and the progress', () => {
    const progress = {
      isDetected: true,
      manifests: 2,
      detected: 6,
      followed: 6,
      checked: 6,
      unresolved: 0,
    }

    expect(Pane.paneStackOf({ ...STATE, progress })).toEqual({
      items: Fixtures.STACK_SAMPLE.filter(item =>
        ['react', 'vite', 'requests', 'zod'].includes(item.release.name),
      ),
      filter: 're',
      expanded: [],
      settings: { isEnabled: true, includeDev: false, showLevel: 'minor+' },
      hidden: 2,
      progress,
    })
    expect(Pane.paneStackOf({ ...STATE, expanded: ['npm:react'] })?.expanded).toEqual(['npm:react'])
  })

  test('no stack tab before the project is known; while its stack is off the tab lists nothing and says it is off', () => {
    expect(Pane.paneStackOf({ ...STATE, root: null })).toBeUndefined()
    expect(
      Pane.paneStackOf({ ...STATE, settings: { ...STATE.settings, isEnabled: false } }),
    ).toMatchObject({ items: [], hidden: 0, settings: { isEnabled: false } })
  })
})
