import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'

describe('is-version-only', () => {
  test('v-tags, plain semver, prereleases and build metadata are versions', () => {
    for (const title of [
      'v1.2.3',
      'v0.3.293',
      'v2',
      'v1.2',
      '1.12.0',
      '1.2',
      '1.0.0-rc.1',
      'v2.0.0-beta.3',
      '1.2.3+build.5',
      '  v1.2.3  ',
    ]) {
      expect([title, Items.isVersionOnly(title)]).toEqual([title, true])
    }
  })

  test('date tags, alone or with a prerelease word, are versions', () => {
    for (const title of ['2026-07-28', '2026-07-28 RC', '2026-07-28 rc.2', '2026-07-28-beta']) {
      expect([title, Items.isVersionOnly(title)]).toEqual([title, true])
    }
  })

  test('Release before a version is still only a version', () => {
    for (const title of ['Release 7.3.1', 'Release v1.2', 'release v2.1.293']) {
      expect([title, Items.isVersionOnly(title)]).toEqual([title, true])
    }
  })

  test('a headline, a package or a lone v is not', () => {
    for (const title of [
      '',
      'v',
      'Claude Code v2.1.293 adds new things',
      '@scope/pkg@1.2.3',
      'pkg@1.2.3',
      'react 19.0.0',
      'Version 1.2.3',
      'Release notes',
      'Release v1.2 is out',
      '2026-07-28 weekly digest',
      '2026',
      '1',
      'AI News for 2026-07-28',
    ]) {
      expect([title, Items.isVersionOnly(title)]).toEqual([title, false])
    }
  })
})
