import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Summaries from '../../../hooks/summaries'
import Fixtures from '../../fixtures'

describe('start-stack', () => {
  test('mirrors the kept releases, detects the stack, then starts and runs the first refresh', async () => {
    const sample = Fixtures.STACK_SAMPLE
    const fake = Fixtures.fakeHostOf(Fixtures.stackStoreOf(sample, { showLevel: 'all' }))
    const loop = Stack.stackLoopOf()

    Object.assign(fake.host, Fixtures.fakeFsOf('/repo', Fixtures.stackTreeOf(sample)))

    const run = await Stack.startStack(fake.host, loop, Summaries.summaryJobsOf())

    expect([loop.root, loop.isStarted, run.isSkipped]).toEqual(['/repo', true, false])
    expect(fake.state.stack).toMatchObject({ root: '/repo', items: sample })
    expect(
      Fixtures.depsAt(fake.stored, '/repo')
        .map(dep => dep.name)
        .sort(),
    ).toEqual(sample.map(item => item.release.name).sort())
    // The first refresh looked the packages up (the fake web knows none).
    expect(fake.fetched.length > 0).toBe(true)
  })

  test('a project its session cannot list still starts, with debug lines only', async () => {
    const fake = Fixtures.fakeHostOf()
    const loop = Stack.stackLoopOf()

    await Stack.startStack(fake.host, loop, Summaries.summaryJobsOf())

    expect(loop.isStarted).toBe(true)
    expect(fake.logs.every(line => line.startsWith('herald: deps: '))).toBe(true)
  })
})
