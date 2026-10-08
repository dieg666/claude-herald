import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('target-release-of', () => {
  const at = (version: string, fields: Parameters<typeof Fixtures.stackItemAt>[2] = {}) =>
    Fixtures.stackItemAt('pkg', version, { current: '7.0.0', ...fields })
  const targetOf = (...releases: [ReturnType<typeof at>, ...ReturnType<typeof at>[]]) =>
    Stack.targetReleaseOf(releases).release.version

  test('a backport published after a higher release does not replace it', () => {
    expect(
      targetOf(
        at('7.0.3', { level: 'patch', publishedAt: '2026-10-01T00:00:00Z' }),
        at('8.0.0', { level: 'major', publishedAt: '2026-09-01T00:00:00Z' }),
      ),
    ).toBe('8.0.0')
  })

  test('the highest version wins whatever order the dates give', () => {
    expect(targetOf(at('7.2.0'), at('7.10.0'), at('7.1.0'))).toBe('7.10.0')
    expect(targetOf(at('v1.0.0', { ecosystem: 'go' }), at('v1.1.0', { ecosystem: 'go' }))).toBe(
      'v1.1.0',
    )
  })

  test('a pre-release after the last stable release is not the target, unless no stable one is shown', () => {
    expect(targetOf(at('9.0.0-rc.1', { isPrerelease: true }), at('8.1.0'))).toBe('8.1.0')
    expect(
      targetOf(at('9.0.0-rc.1', { isPrerelease: true }), at('9.0.0-rc.2', { isPrerelease: true })),
    ).toBe('9.0.0-rc.2')
  })

  test('the newer date wins a tie; a version that cannot be parsed ranks below one that can, and alone is taken as it comes', () => {
    const newer = at('8.0.0', { title: 'newer' })
    const older = at('8.0.0', { title: 'older' })

    expect(Stack.targetReleaseOf([newer, older]).title).toBe('newer')
    expect(targetOf(at('nightly'), at('7.0.1'))).toBe('7.0.1')
    expect(targetOf(at('nightly'), at('canary'))).toBe('nightly')
    expect(
      Stack.targetReleaseOf([
        { ...newer, release: { ...newer.release, version: undefined } },
        older,
      ]).title,
    ).toBe('older')
  })
})
