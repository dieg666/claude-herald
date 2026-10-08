import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'
import Stack from '../../../hooks/deps/stack'
import Fixtures from '../../fixtures'

describe('stack-item-of-release', () => {
  const PAGE = 'https://github.com/owner/repo/releases'

  test('a classified release as an item of the stack, its versions without a leading v', () => {
    const [release] = Classify.classifyReleases(
      Fixtures.depAt('acme', { versionInUse: 'v1.0.0' }),
      [
        {
          ...Fixtures.releaseAt('v2.0.0', 'BREAKING: removes x.'),
          publishedAt: '2026-01-01T00:00:00Z',
        },
      ],
    )

    expect(release).toBeDefined()

    const item = Stack.stackItemOfRelease(release ?? ({} as never), PAGE)

    expect(item).toEqual({
      id: '@stack:npm:acme|tag:github.com,2008:Repository/1/v2.0.0',
      sourceId: '@stack',
      title: 'v2.0.0',
      url: 'https://github.com/owner/repo/releases/tag/v2.0.0',
      publishedAt: '2026-01-01T00:00:00Z',
      text: 'BREAKING: removes x.',
      release: {
        releaseId: 'npm:acme|tag:github.com,2008:Repository/1/v2.0.0',
        ecosystem: 'npm',
        name: 'acme',
        current: '1.0.0',
        version: '2.0.0',
        level: 'major',
        isPrerelease: false,
        breaking: true,
        security: false,
      },
    })
    expect(Stack.isStackItem(item)).toBe(true)
  })

  test('without a link the feed page is used, without a title the version; long notes are cut', () => {
    const [release] = Classify.classifyReleases(Fixtures.depAt('acme', { versionInUse: '1.0.0' }), [
      { guid: 'g', title: 'v1.1.0', summary: 'x'.repeat(5000) },
    ])
    const item = Stack.stackItemOfRelease({ ...(release ?? ({} as never)), title: ' ' }, PAGE)

    expect([item.url, item.title, item.text.length]).toEqual([
      PAGE,
      'v1.1.0',
      Stack.STACK_LIMITS.textChars,
    ])
  })
})
