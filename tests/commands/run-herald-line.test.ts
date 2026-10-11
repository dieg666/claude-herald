import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Stack from '../../hooks/deps/stack'
import Fixtures from '../fixtures'

describe('run-herald-line', () => {
  const failing = (debug: (text: string) => unknown) => {
    const { host } = Fixtures.fakeHostOf({ sources: [] })

    return {
      ...host,
      storeGet: () => Promise.reject(new Error('store unavailable')),
      debug,
    } as typeof host
  }

  test('a failure answers its text and logs one debug line', async () => {
    const logs: string[] = []
    const reply = await Commands.runHeraldLine(
      failing(text => void logs.push(text)),
      'list',
      Stack.stackLoopOf(),
    )

    expect(reply.text).toBe('/herald list failed: store unavailable')
    expect(logs).toEqual(['herald: /herald list: store unavailable'])
  })

  test('a log that throws or rejects, as under re-entry, still leaves the failure answered', async () => {
    const throwing = await Commands.runHeraldLine(
      failing(() => {
        throw new Error('logging refused')
      }),
      'list',
      Stack.stackLoopOf(),
    )
    const rejecting = await Commands.runHeraldLine(
      failing(() => Promise.reject(new Error('logging refused'))),
      'list',
      Stack.stackLoopOf(),
    )

    expect(throwing.text).toBe('/herald list failed: store unavailable')
    expect(rejecting).toEqual(throwing)
  })
})
