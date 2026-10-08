import { describe, expect, test } from 'claude-code/testing'

import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('release-of-stack-item', () => {
  test('a stack item as the release the flag check reads: its id, package, versions, notes and flags', () => {
    const [react] = Fixtures.STACK_SAMPLE

    expect(Stack.releaseOfStackItem(react!)).toEqual({
      id: react?.release.releaseId,
      dependency: { ecosystem: 'npm', name: 'react', isDev: false, isRoot: true, manifestPath: '' },
      version: '19.0.0',
      current: '18.2.0',
      level: 'major',
      isPrerelease: false,
      title: 'React 19',
      url: 'https://github.com/owner/react/releases/tag/v19.0.0',
      publishedAt: '2026-01-06T00:00:00Z',
      notes: 'Notes of react 19.0.0.',
      flags: { breaking: true, security: false },
    })
  })

  test('a release without versions or a date leaves them out', () => {
    const item = Fixtures.stackItemAt('a', '1.0.0')
    const { version, ...release } = item.release
    const classified = Stack.releaseOfStackItem({ ...item, release })

    expect(version).toBe('1.0.0')
    expect('version' in classified || 'current' in classified || 'publishedAt' in classified).toBe(
      false,
    )
  })
})
