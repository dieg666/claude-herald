import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Store from '../../../hooks/store'
import Fixtures from '../../fixtures'

describe('stack-state-of', () => {
  const store = Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE, { showLevel: 'all' })
  const project = Store.depsProjectOf(store.deps['/repo'])
  const stack = Store.stackProjectOf(store.stack['/repo'])

  test('the kept releases of the followed packages, newest first, with the project settings', () => {
    const state = Stack.stackStateOf('/repo', project, stack, { root: null, filter: '' })

    expect(state.root).toBe('/repo')
    expect(state.settings.showLevel).toBe('all')
    expect(state.items.map(item => item.release.name)).toEqual([
      'react',
      'vite',
      'lodash',
      'requests',
      'next',
      'zod',
    ])
  })

  test('a package no longer followed shows nothing; the filter stays for the same project only', () => {
    const fewer = { ...project, dependencies: project.dependencies.slice(0, 1) }

    expect(
      Stack.stackStateOf('/repo', fewer, stack, { root: '/repo', filter: 're' }),
    ).toMatchObject({ items: [Fixtures.STACK_SAMPLE[0]], filter: 're' })
    expect(Stack.stackStateOf('/repo', fewer, stack, { root: '/other', filter: 're' }).filter).toBe(
      '',
    )
  })

  test('the packages expanded stay for the same project only', () => {
    const same = Stack.stackStateOf('/repo', project, stack, {
      root: '/repo',
      filter: '',
      expanded: ['npm:react'],
    })
    const other = Stack.stackStateOf('/repo', project, stack, {
      root: '/other',
      filter: '',
      expanded: ['npm:react'],
    })

    expect([same.expanded, other.expanded]).toEqual([['npm:react'], undefined])
  })
})
