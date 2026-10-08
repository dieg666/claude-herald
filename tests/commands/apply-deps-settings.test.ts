import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Stack from '../../hooks/deps/stack'
import Summaries from '../../hooks/summaries'
import Fixtures from '../fixtures'

describe('apply-deps-settings', () => {
  const NOW = 1_000_000_000
  const REACT = Fixtures.depAt('react', { versionInUse: '18.2.0' })
  const FEED = 'https://github.com/owner/react/releases.atom'

  test('saves the patch over the stored settings and mirrors the project to state', async () => {
    const fake = Fixtures.fakeHostOf({ deps: { '/repo': { settings: { cap: 7 } } } })
    const loop = Stack.stackLoopOf()

    const settings = await Commands.applyDepsSettings(fake.host, loop, '/repo', {
      showLevel: 'all',
    })

    expect(settings).toMatchObject({ cap: 7, showLevel: 'all' })
    expect(fake.state.stack).toMatchObject({
      root: '/repo',
      settings: { cap: 7, showLevel: 'all' },
    })
  })

  test("waits for a refresh's write in flight, so that write cannot put the old settings back in state", async () => {
    const clocked = Fixtures.clockedHostOf(
      {
        deps: { '/repo': { settings: {}, dependencies: [REACT], detectedAt: 1 } },
        depFeeds: { 'npm:react': { repo: 'owner/react', feed: FEED, resolvedAt: NOW } },
      },
      NOW,
    )
    const { host, web, clock } = clocked
    const loop = Stack.stackLoopOf()
    const storeSet = host.storeSet
    let release = () => {}
    const held = new Promise<void>(resolve => {
      release = resolve
    })

    Object.assign(host, Fixtures.fakeFsOf('/repo', { '.git': { isDir: true } }))
    host.storeSet = async (key, value) => {
      if (key === 'stack') {
        await held
      }

      return storeSet(key, value)
    }
    web.set(FEED, { status: 200, text: '<feed xmlns="http://www.w3.org/2005/Atom"></feed>' })
    loop.isStarted = true

    const running = Stack.refreshStack(host, loop, Summaries.summaryJobsOf())

    await clock.settle()

    const applying = Commands.applyDepsSettings(host, loop, '/repo', { showLevel: 'all' })

    await clock.settle()
    release()
    await running
    await applying

    expect(clocked.state.stack).toMatchObject({ settings: { showLevel: 'all' } })
  })
})
