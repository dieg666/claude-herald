import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'
import Stack from '../../../hooks/deps/stack'

describe('needs-lookup', () => {
  const NOW = 100 * Resolve.RESOLVE_LIMITS.ttlMs
  const FEED = 'https://github.com/a/b/releases.atom'

  test('a package never resolved, or resolved past the TTL, needs a lookup', () => {
    expect(Stack.needsLookup(undefined, NOW)).toBe(true)
    expect(
      Stack.needsLookup({ feed: FEED, resolvedAt: NOW - Resolve.RESOLVE_LIMITS.ttlMs }, NOW),
    ).toBe(true)
  })

  test('a fresh mapping, negative ones included, and a feed override need none', () => {
    expect(Stack.needsLookup({ feed: FEED, resolvedAt: NOW - 1 }, NOW)).toBe(false)
    expect(Stack.needsLookup({ reason: 'not found', resolvedAt: NOW }, NOW)).toBe(false)
    expect(Stack.needsLookup({ feed: FEED, resolvedAt: 0, isOverride: true }, NOW)).toBe(false)
  })

  test('a repository override not checked yet, or a mapping from the future, needs one', () => {
    expect(Stack.needsLookup({ repo: 'a/b', resolvedAt: NOW, isOverride: true }, NOW)).toBe(true)
    expect(Stack.needsLookup({ feed: FEED, resolvedAt: NOW + 1 }, NOW)).toBe(true)
  })
})
