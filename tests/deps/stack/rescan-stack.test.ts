import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Summaries from '../../../hooks/summaries'
import Fixtures from '../../fixtures'

describe('rescan-stack', () => {
  const TREE = {
    '.git': { isDir: true as const },
    'package.json': JSON.stringify({ dependencies: { react: '18.2.0' } }),
  }

  /** A started stack over a project at /repo detected once, its manifests unchanged since. */
  const startedOf = async () => {
    const clocked = Fixtures.clockedHostOf({}, 1_000)
    const fs = Fixtures.fakeFsOf('/repo', TREE)
    const loop = Stack.stackLoopOf()
    const jobs = Summaries.summaryJobsOf()

    Object.assign(clocked.host, fs)
    await Stack.startStack(clocked.host, loop, jobs)

    const manifestReads = () => fs.reads.filter(path => path === '/repo/package.json').length

    return { ...clocked, fs, loop, jobs, manifestReads }
  }

  test('detects the stack again though no manifest changed, then refreshes once', async () => {
    const { host, loop, jobs, fs, manifestReads } = await startedOf()
    const before = manifestReads()

    fs.write('package.json', JSON.stringify({ dependencies: { react: '18.2.0', zod: '3.0.0' } }))

    const run = await Stack.rescanStack(host, loop, jobs)

    expect(run.isSkipped).toBe(false)
    expect(manifestReads()).toBe(before + 1)
    expect(loop.isDetectPending).toBe(false)
  })

  test('rescans asked while a refresh runs make one more run after it, which detects once', async () => {
    const { host, loop, jobs, clock, manifestReads } = await startedOf()
    let release = () => {}
    const held = new Promise<void>(resolve => {
      release = resolve
    })
    const first = loop.serially(() => held)
    const running = Stack.refreshStack(host, loop, jobs)
    const before = manifestReads()

    expect((await Stack.rescanStack(host, loop, jobs)).isSkipped).toBe(true)
    expect((await Stack.rescanStack(host, loop, jobs)).isSkipped).toBe(true)

    release()
    await first
    await running
    await clock.settle()

    expect(loop.running).toBeUndefined()
    expect(manifestReads()).toBe(before + 1)
  })

  test('before the start detection it does nothing, and the start detection serves it', async () => {
    const clocked = Fixtures.clockedHostOf({}, 1_000)
    const fs = Fixtures.fakeFsOf('/repo', TREE)
    const loop = Stack.stackLoopOf()
    const jobs = Summaries.summaryJobsOf()

    Object.assign(clocked.host, fs)

    expect((await Stack.rescanStack(clocked.host, loop, jobs)).isSkipped).toBe(true)
    expect(fs.reads).toEqual([])

    await Stack.startStack(clocked.host, loop, jobs)

    expect(fs.reads.filter(path => path === '/repo/package.json').length).toBe(1)
  })
})
