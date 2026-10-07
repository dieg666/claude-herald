import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'
import Fixtures from '../../fixtures'

describe('project-root-of', () => {
  const hostAt = (tree: Parameters<typeof Fixtures.fakeFsOf>[1], sessionRoot: string) => {
    const fake = Fixtures.fakeHostOf()
    const fs = Fixtures.fakeFsOf('/repo', tree, sessionRoot)

    Object.assign(fake.host, fs)

    return { host: fake.host, lists: fs.lists }
  }

  test('the closest directory above the session root that holds .git', async () => {
    const { host } = hostAt(
      { '.git': { isDir: true }, 'packages/web/package.json': '{}' },
      '/repo/packages/web',
    )

    expect(await Detect.projectRootOf(host)).toBe('/repo')
  })

  test('a worktree, where .git is a file, is its own root', async () => {
    const { host } = hostAt({ 'wt/.git': 'gitdir: elsewhere', 'wt/package.json': '{}' }, '/repo/wt')

    expect(await Detect.projectRootOf(host)).toBe('/repo/wt')
  })

  test('outside any repository the session root stands, after looking up to the filesystem root', async () => {
    const { host, lists } = hostAt({ 'app/package.json': '{}' }, '/repo/app')

    expect(await Detect.projectRootOf(host)).toBe('/repo/app')
    expect(lists).toEqual(['/repo/app', '/repo', '/'])
  })
})
