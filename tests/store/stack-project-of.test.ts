import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('stack-project-of', () => {
  test('a stored record reads back as stored', () => {
    const { stack } = Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE)

    expect(Store.stackProjectOf(JSON.parse(JSON.stringify(stack['/repo'])))).toEqual(stack['/repo'])
  })

  test('entries that are not one are dropped; anything else reads as empty', () => {
    const [react] = Fixtures.STACK_SAMPLE

    expect(
      Store.stackProjectOf({
        deps: {
          'npm:react': {
            checkedAt: 5,
            seen: ['a', 7],
            items: [react, { ...react, release: { ...react?.release, ecosystem: 'cpan' } }, 3],
          },
          'npm:bad': { seen: [] },
        },
        refreshedAt: 'soon',
      }),
    ).toEqual({
      deps: { 'npm:react': { checkedAt: 5, seen: ['a'], items: [react] } },
      refreshedAt: 0,
    })
    expect(Store.stackProjectOf(undefined)).toEqual({ deps: {}, refreshedAt: 0 })
    expect(Store.stackItemOf(Fixtures.itemAt('a'))).toBeUndefined()
  })
})
