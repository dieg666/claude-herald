import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Store from '../../../hooks/store'
import Summaries from '../../../hooks/summaries'
import Fixtures from '../../fixtures'

describe('flag-shown', () => {
  const [, vite] = Fixtures.STACK_SAMPLE

  /** A host whose store and state hold the sample stack of /repo. */
  const shownAt = (entries: Readonly<Record<string, unknown>> = {}) => {
    const fake = Fixtures.fakeHostOf({
      ...Fixtures.stackStoreOf(Fixtures.STACK_SAMPLE),
      ...entries,
    })

    fake.state.stack = {
      root: '/repo',
      settings: Store.depsSettingsOf({}),
      items: Fixtures.STACK_SAMPLE,
      filter: '',
    }

    return fake
  }

  test('a shown stack item the model reads as breaking is flagged ⚠ in the store and state; news items are left alone', async () => {
    const { host, replies, asked, stored, state } = shownAt()

    replies.push(Fixtures.answerOf('{"breaking": true, "security": false}'))

    const changed = await Stack.flagShown(host, Stack.stackLoopOf(), Summaries.summaryJobsOf(), [
      Fixtures.itemAt('a'),
      vite!,
    ])

    expect(asked.length).toBe(1)
    expect([...changed.values()]).toEqual([{ breaking: true, security: false }])

    const kept = Store.stackProjectOf((stored.get('stack') as Record<string, unknown>)['/repo'])

    expect(kept.deps['npm:vite']?.items[0]?.release.breaking).toBe(true)
    expect(
      (state.stack as { items: typeof Fixtures.STACK_SAMPLE }).items[1]?.release.breaking,
    ).toBe(true)
  })

  test('a cached verdict needs no call, and no change writes nothing', async () => {
    const { host, asked, sets } = shownAt({
      releaseFlags: [{ releaseId: vite?.release.releaseId, breaking: false, security: false }],
    })

    const changed = await Stack.flagShown(host, Stack.stackLoopOf(), Summaries.summaryJobsOf(), [
      vite!,
    ])

    expect(changed.size).toBe(0)

    expect(asked).toEqual([])
    expect(sets).toEqual([])
  })
})
