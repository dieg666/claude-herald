import { describe, expect, test } from 'claude-code/testing'

import Fixtures from '../fixtures'

describe('show-deps', () => {
  const REPO = { '.git': { isDir: true as const } }

  const projectOf = (fields: Record<string, unknown>) => ({
    deps: {
      '/repo': {
        settings: {},
        dependencies: [],
        detectedCount: 0,
        manifestHashes: {},
        detectedAt: 1,
        ...fields,
      },
    },
  })

  test('lists the followed packages by ecosystem with version and status, then the ignored ones, from the store alone', async ($, on) => {
    Fixtures.storeOn(on, {
      ...projectOf({
        dependencies: [
          Fixtures.depAt('react', { versionInUse: '18.2.0' }),
          Fixtures.depAt('zod', { range: '^3.22.0' }),
          Fixtures.depAt('left-pad', { versionInUse: '1.0.0' }),
          Fixtures.depAt('tiny', { versionInUse: '0.1.0' }),
          Fixtures.depAt('requests', { ecosystem: 'pypi', versionInUse: '2.31.0' }),
          Fixtures.depAt('owner/tool', {
            ecosystem: 'github',
            manifestPath: '',
            source: 'https://github.com/owner/tool',
          }),
        ],
        detectedCount: 7,
        ignored: ['npm:lodash'],
        added: [
          Fixtures.depAt('owner/tool', {
            ecosystem: 'github',
            manifestPath: '',
            source: 'https://github.com/owner/tool',
          }),
        ],
      }),
      depFeeds: {
        'npm:react': {
          repo: 'facebook/react',
          feed: 'https://github.com/facebook/react/releases.atom',
          resolvedAt: 1,
        },
        'npm:zod': {
          repo: 'colinhacks/zod',
          feed: 'https://github.com/colinhacks/zod/releases.atom',
          resolvedAt: 1,
          isOverride: true,
        },
        'npm:tiny': {
          repo: 'me/tiny',
          feed: 'https://github.com/me/tiny/tags.atom',
          resolvedAt: 1,
        },
        'npm:left-pad': { reason: 'repository not on GitHub', resolvedAt: 1 },
      },
    })
    Fixtures.fsOn(on, REPO)

    const fetched = Fixtures.webOn(on, new Map())
    const { text } = await $.command.run(Fixtures.newsOf('deps'))

    expect(text).toBe(
      [
        'Your stack in /repo: on · runtime dependencies only · at most 50 · band and pane show minor+ · toasts at breaking+security',
        '7 detected · 6 followed · 1 added · 1 ignored',
        '',
        'npm (4)',
        '  react 18.2.0 → facebook/react',
        '  zod ^3.22.0 → colinhacks/zod (mapped)',
        '  left-pad 1.0.0: unresolved, repository not on GitHub',
        '  tiny 0.1.0 → me/tiny (tags)',
        'PyPI (1)',
        '  requests 2.31.0: not looked up yet',
        'GitHub (1)',
        '  owner/tool (added): not looked up yet',
        '',
        'Ignored: npm:lodash',
        '',
        '/news deps help lists what you can change.',
      ].join('\n'),
    )
    expect(fetched).toEqual([])
  })

  test('a project never detected says how to detect it; one with nothing followed says so', async ($, on) => {
    const stored = Fixtures.storeOn(on, projectOf({ detectedAt: 0 }))

    Fixtures.fsOn(on, REPO)

    expect((await $.command.run(Fixtures.newsOf('deps'))).text).toContain(
      '0 detected · 0 followed\n\nNot detected yet; /news deps rescan detects it now.',
    )

    stored.set('deps', projectOf({ detectedAt: 5 }).deps)

    expect((await $.command.run(Fixtures.newsOf('deps'))).text).toContain(
      '\n\nNo dependency is followed.\n',
    )
  })

  test('a stack turned off says nothing is fetched and how to turn it on', async ($, on) => {
    Fixtures.storeOn(on, projectOf({ settings: { isEnabled: false, toastLevel: 'off' } }))
    Fixtures.fsOn(on, REPO)

    const { text } = await $.command.run(Fixtures.newsOf('deps'))

    expect(text).toMatch(/^Your stack in \/repo: off · .* · no toasts\n/)
    expect(text).toContain(
      '\nNothing is followed or fetched while it is off; /news deps on turns it on.\n',
    )
  })

  test('outside a git repository the folder alone is the project; at a filesystem root there is none', async ($, on) => {
    const root = { current: '/work' }

    Fixtures.storeOn(on)
    on('session.root', () => ({ value: root.current }))
    on('fs.list', () => ({ value: [] }))

    expect((await $.command.run(Fixtures.newsOf('deps'))).text).toMatch(
      /^Your stack in \/work: on .*\nNot in a git repository: only the manifests in this folder are read\.\n/,
    )

    root.current = '/'

    expect((await $.command.run(Fixtures.newsOf('deps'))).text).toBe(
      'The session runs at a filesystem root, so /news deps has no project to follow.',
    )
  })

  test('50 packages are all listed in a few kilobytes; past 200 the rest are counted', async ($, on) => {
    const many = (count: number) =>
      Array.from({ length: count }, (_, index) =>
        Fixtures.depAt(`package-${index}`, { versionInUse: '1.2.3' }),
      )
    const stored = Fixtures.storeOn(on, projectOf({ dependencies: many(50), detectedCount: 50 }))

    Fixtures.fsOn(on, REPO)

    const fifty = (await $.command.run(Fixtures.newsOf('deps'))).text ?? ''

    expect(fifty).toContain('  package-49 1.2.3: not looked up yet')
    expect(fifty.length < 3000).toBe(true)

    stored.set('deps', projectOf({ dependencies: many(260), detectedCount: 260 }).deps)

    const lots = (await $.command.run(Fixtures.newsOf('deps'))).text ?? ''

    expect(lots).toContain('  package-199 1.2.3')
    expect(lots).not.toContain('package-200 ')
    expect(lots).toContain('\n… and 60 more\n')
  })

  test('names, versions and reasons from the store are one line each and cut', async ($, on) => {
    Fixtures.storeOn(on, {
      ...projectOf({
        dependencies: [
          Fixtures.depAt('we"ird\nname', { versionInUse: `1.0.0\t${'x'.repeat(50)}` }),
        ],
      }),
      depFeeds: { 'npm:we"ird\nname': { reason: `gone\n${'y'.repeat(200)}`, resolvedAt: 1 } },
    })
    Fixtures.fsOn(on, REPO)

    const line = (await $.command.run(Fixtures.newsOf('deps'))).text
      ?.split('\n')
      .find(row => row.startsWith('  we"ird'))

    expect(line).toBe(`  we"ird name 1.0.0 ${'x'.repeat(23)}…: unresolved, gone ${'y'.repeat(74)}…`)
  })
})
