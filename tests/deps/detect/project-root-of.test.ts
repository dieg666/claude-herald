import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'
import Fixtures from '../../fixtures'

describe('project-root-of', () => {
  const hostAt = (
    tree: Parameters<typeof Fixtures.fakeFsOf>[1],
    sessionRoot: string,
    { root = '/repo', home }: { root?: string; home?: string } = {},
  ) => {
    const fake = Fixtures.fakeHostOf()
    const fs = Fixtures.fakeFsOf(root, tree, sessionRoot)

    Object.assign(fake.host, fs, { homeDir: async () => home })

    return { host: fake.host, lists: fs.lists }
  }

  test('the closest directory above the session root that holds .git, walked to the full depth', async () => {
    const { host } = hostAt(
      { '.git': { isDir: true }, 'packages/web/package.json': '{}' },
      '/repo/packages/web',
    )

    expect(await Detect.projectRootOf(host)).toEqual({ path: '/repo', maxDepth: 4 })
  })

  test('a worktree, where .git is a file, is its own root', async () => {
    const { host } = hostAt({ 'wt/.git': 'gitdir: elsewhere', 'wt/package.json': '{}' }, '/repo/wt')

    expect(await Detect.projectRootOf(host)).toEqual({ path: '/repo/wt', maxDepth: 4 })
  })

  test('outside any repository the session root alone is read, after looking up to the filesystem root', async () => {
    const { host, lists } = hostAt({ 'app/package.json': '{}' }, '/repo/app')

    expect(await Detect.projectRootOf(host)).toEqual({ path: '/repo/app', maxDepth: 0 })
    expect(lists).toEqual(['/repo/app', '/repo', '/'])
  })

  test('a .git in the home directory does not make it the project; the look-up stops below it', async () => {
    const { host, lists } = hostAt(
      { '.git': { isDir: true }, 'code/app/package.json': '{}' },
      '/home/u/code/app',
      { root: '/home/u', home: '/home/u/' },
    )

    expect(await Detect.projectRootOf(host)).toEqual({ path: '/home/u/code/app', maxDepth: 0 })
    expect(lists).toEqual(['/home/u/code/app', '/home/u/code'])
  })

  test('a repository below the home directory is still found', async () => {
    const { host } = hostAt(
      { '.git': { isDir: true }, 'code/app/.git': { isDir: true }, 'code/app/src/a.ts': '' },
      '/home/u/code/app/src',
      { root: '/home/u', home: '/home/u' },
    )

    expect(await Detect.projectRootOf(host)).toEqual({ path: '/home/u/code/app', maxDepth: 4 })
  })

  test('a session at the home directory is read alone, even when it holds .git', async () => {
    const { host, lists } = hostAt({ '.git': { isDir: true } }, '/home/u', {
      root: '/home/u',
      home: '/home/u',
    })

    expect(await Detect.projectRootOf(host)).toEqual({ path: '/home/u', maxDepth: 0 })
    expect(lists).toEqual([])
  })

  test('a session at a filesystem root is not a project, and nothing is listed', async () => {
    const posix = hostAt({ '.git': { isDir: true } }, '/', { root: '/' })
    const windows = hostAt({}, 'C:\\')

    expect(await Detect.projectRootOf(posix.host)).toBeUndefined()
    expect(await Detect.projectRootOf(windows.host)).toBeUndefined()
    expect([...posix.lists, ...windows.lists]).toEqual([])
  })

  test('a home directory that cannot be read only means no stop below the filesystem root', async () => {
    const { host } = hostAt({ 'app/package.json': '{}' }, '/repo/app')

    host.homeDir = async () => {
      throw new Error('denied')
    }

    expect(await Detect.projectRootOf(host)).toEqual({ path: '/repo/app', maxDepth: 0 })
  })
})
