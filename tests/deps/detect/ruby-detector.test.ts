import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../../fixtures'
import Ruby from '../../fixtures/deps/ruby'

describe('ruby-detector', () => {
  const MASTODON = { Gemfile: Ruby.MASTODON_GEMFILE, 'Gemfile.lock': Ruby.MASTODON_GEMFILE_LOCK }

  test('gems take the Gemfile.lock version, platform suffix dropped', async () => {
    const { dependencies } = await Fixtures.scanOf(MASTODON)

    expect(Fixtures.depNamed(dependencies, 'rails')).toEqual({
      ecosystem: 'rubygems',
      name: 'rails',
      versionInUse: '8.1.4',
      range: '~> 8.1.0',
      isDev: false,
      isRoot: true,
      manifestPath: 'Gemfile',
    })
    expect(Fixtures.depNamed(dependencies, 'nokogiri')?.versionInUse).toBe('1.19.4')
  })

  test('development and test groups, and optional groups, count as dev', async () => {
    const { dependencies } = await Fixtures.scanOf(MASTODON)

    expect(Fixtures.depNamed(dependencies, 'rspec-rails')).toMatchObject({
      isDev: true,
      versionInUse: '8.0.4',
    })
    expect(Fixtures.depNamed(dependencies, 'devise_pam_authenticatable2')?.isDev).toBe(true)
    expect(Fixtures.depNamed(dependencies, 'puma')?.isDev).toBe(false)
  })

  test('a git gem keeps its repository', async () => {
    const { dependencies } = await Fixtures.scanOf(MASTODON)

    expect(Fixtures.depNamed(dependencies, 'webpush')).toMatchObject({
      source: 'https://github.com/mastodon/webpush',
      versionInUse: '1.1.0',
    })
  })

  test('without Gemfile.lock the requirements stay as ranges', async () => {
    const { dependencies } = await Fixtures.scanOf({ Gemfile: Ruby.MASTODON_GEMFILE })

    expect(Fixtures.depNamed(dependencies, 'rails')).toEqual({
      ecosystem: 'rubygems',
      name: 'rails',
      range: '~> 8.1.0',
      isDev: false,
      isRoot: true,
      manifestPath: 'Gemfile',
    })
  })

  test('dev gems are left out by default and followed with the toggle', async () => {
    const runtime = await Fixtures.detectedOf(MASTODON, { cap: 500 })
    const all = await Fixtures.detectedOf(MASTODON, { cap: 500, includeDev: true })

    expect(Fixtures.depNamed(runtime.project?.dependencies ?? [], 'rspec-rails')).toBeUndefined()
    expect(Fixtures.depNamed(all.project?.dependencies ?? [], 'rspec-rails')?.isDev).toBe(true)
    expect(runtime.project?.dependencies.every(dependency => !dependency.isDev)).toBe(true)
  })

  test('a Gemfile with an unclosed block is skipped with a debug line, never thrown', async () => {
    const { dependencies, logs } = await Fixtures.scanOf({
      Gemfile: Ruby.BROKEN_GEMFILE,
      'Gemfile.lock': Ruby.MASTODON_GEMFILE_LOCK,
    })

    expect(dependencies).toEqual([])
    expect(logs).toContain('news: deps: skipped Gemfile: a block is never closed')
  })
})
