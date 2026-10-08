import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('is-release-feed', () => {
  test("a GitHub repository's releases.atom or tags.atom is a release feed", () => {
    for (const url of [
      'https://github.com/anthropics/claude-code/releases.atom',
      'https://github.com/owner/repo/tags.atom',
      'http://www.github.com/Owner/Repo/releases.atom',
      ' https://GitHub.com/owner/repo/releases.atom?x=1 ',
    ]) {
      expect([url, Items.isReleaseFeed(url)]).toEqual([url, true])
    }
  })

  test('any other address is not', () => {
    for (const url of [
      'https://hnrss.org/frontpage',
      'https://github.blog/changelog/feed/',
      'https://github.com/owner/releases.atom',
      'https://github.com/owner/repo/commits.atom',
      'https://example.com/github.com/owner/repo/releases.atom',
      'https://gitlab.com/owner/repo/releases.atom',
      'https://www.anthropic.com/news',
    ]) {
      expect([url, Items.isReleaseFeed(url)]).toEqual([url, false])
    }
  })
})
