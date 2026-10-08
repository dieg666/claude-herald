import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Store from '../../../hooks/store'
import Fixtures from '../../fixtures'

describe('stack-progress-of', () => {
  const store = Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE)
  const project = Store.depsProjectOf(store.deps['/repo'])
  const stack = Store.stackProjectOf(store.stack['/repo'])

  test('detected, the manifests and dependencies found, the packages followed and read', () => {
    const detected = {
      ...project,
      manifestHashes: { 'package.json': 'h', 'package-lock.json': 'k' },
    }

    expect(Stack.stackProgressOf(detected, stack, {})).toEqual({
      isDetected: true,
      manifests: 2,
      detected: 6,
      followed: 6,
      checked: 6,
      unresolved: 0,
    })
  })

  test('a package not read yet counts as unresolved only when its mapping says it has no feed', () => {
    const [first, second] = Object.keys(stack.deps)
    const unread = {
      ...stack,
      deps: Object.fromEntries(
        Object.entries(stack.deps).filter(([key]) => key !== first && key !== second),
      ),
    }
    const feeds = {
      [first ?? '']: { reason: 'no repository', resolvedAt: 1 },
      [second ?? '']: {
        repo: 'owner/x',
        feed: 'https://github.com/owner/x/releases.atom',
        resolvedAt: 1,
      },
    }

    expect(Stack.stackProgressOf(project, unread, feeds)).toMatchObject({
      followed: 6,
      checked: 4,
      unresolved: 1,
    })
  })

  test('a project never detected', () => {
    const fresh = Store.depsProjectOf(undefined)

    expect(Stack.stackProgressOf(fresh, Store.stackProjectOf(undefined), {})).toEqual({
      isDetected: false,
      manifests: 0,
      detected: 0,
      followed: 0,
      checked: 0,
      unresolved: 0,
    })
  })
})
