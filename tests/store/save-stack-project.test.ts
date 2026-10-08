import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('save-stack-project', () => {
  test('changes one project, stamped with the clock, keeping the others as stored', async () => {
    const other = { deps: {}, refreshedAt: 7 }
    const { host, stored } = Fixtures.fakeHostOf({ stack: { '/other': other } })

    const saved = await Store.saveStackProject(host, '/repo', before => ({
      deps: { ...before.deps, 'npm:a': { checkedAt: 1, seen: ['x'], items: [] } },
    }))

    expect(saved).toEqual({
      deps: { 'npm:a': { checkedAt: 1, seen: ['x'], items: [] } },
      refreshedAt: 1000,
    })
    expect(stored.get('stack')).toEqual({ '/other': other, '/repo': saved })
    expect(await Store.loadStackProject(host, '/repo')).toEqual(saved)
  })

  test('past the most projects kept, the least recently refreshed others are dropped', async () => {
    const projects = Object.fromEntries(
      Array.from({ length: Store.STACK_PROJECTS_MAX }, (_, index) => [
        `/p${index}`,
        { deps: {}, refreshedAt: index },
      ]),
    )
    const { host, stored } = Fixtures.fakeHostOf({ stack: projects })

    await Store.saveStackProject(host, '/new', () => ({ deps: {} }))

    expect(Object.keys(stored.get('stack') as object).sort()).toEqual(
      ['/new', '/p1', '/p2', '/p3', '/p4'].sort(),
    )
  })
})
