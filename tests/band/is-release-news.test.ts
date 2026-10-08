import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'
import Fixtures from '../fixtures'

describe('is-release-news', () => {
  const RELEASES = Fixtures.sourceAt('rel', {
    url: 'https://github.com/anthropics/claude-code/releases.atom',
  })
  const NEWS = Fixtures.sourceAt('hn', { url: 'https://hnrss.org/frontpage' })

  test("a release feed's item is a release, whatever its title", () => {
    expect(Band.isReleaseNews('v2.1.293', RELEASES)).toBe(true)
    expect(Band.isReleaseNews('Claude Code v2.1.293 adds things', RELEASES)).toBe(true)
  })

  test('a title that is only a version is a release from any source, a gone one included', () => {
    expect(Band.isReleaseNews('v1.0.0', NEWS)).toBe(true)
    expect(Band.isReleaseNews('2026-07-28 RC', undefined)).toBe(true)
  })

  test("a news feed's headline is not, nor a headline whose source is gone", () => {
    expect(Band.isReleaseNews('The people holding up the internet', NEWS)).toBe(false)
    expect(Band.isReleaseNews('Claude Code v2.1.293 adds things', undefined)).toBe(false)
  })
})
