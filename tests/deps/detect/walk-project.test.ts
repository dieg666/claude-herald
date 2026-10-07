import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'
import Fixtures from '../../fixtures'

describe('walk-project', () => {
  const keeps = (name: string) => name === 'package.json'

  test('installed packages, environments, build output and dot-directories are never listed', async () => {
    const skipped = [
      'node_modules',
      'vendor',
      '.venv',
      'venv',
      '__pycache__',
      'target',
      'dist',
      'build',
      '_build',
      'deps',
      'Pods',
      '.git',
      '.cache',
    ]
    const { list, lists } = Fixtures.listerOn({
      'src/package.json': '{}',
      ...Object.fromEntries(skipped.map(name => [`${name}/package.json`, '{}'])),
    })

    const files = await Detect.walkProject(list, keeps, 4)

    expect([...files.keys()]).toEqual(['src/package.json'])
    expect(lists).toEqual(['/repo', '/repo/src'])
  })

  test('directories deeper than the bound are never listed', async () => {
    const { list, lists } = Fixtures.listerOn({
      'a/b/package.json': '{}',
      'a/b/c/package.json': '{}',
      'a/b/c/d/package.json': '{}',
    })

    const files = await Detect.walkProject(list, keeps, 2)

    expect([...files.keys()]).toEqual(['a/b/package.json'])
    expect(lists).toEqual(['/repo', '/repo/a', '/repo/a/b'])
  })

  test('links are never followed nor read, as directories or files', async () => {
    const { list, lists } = Fixtures.listerOn({
      'linked-dir': { isLink: true },
      'package.json': { isLink: true },
      'real/package.json': '{}',
    })

    const files = await Detect.walkProject(list, keeps, 4)

    expect([...files.keys()]).toEqual(['real/package.json'])
    expect(lists).toEqual(['/repo', '/repo/real'])
  })

  test('breadth first, names sorted, each kept file with its size', async () => {
    const { list } = Fixtures.listerOn({
      'z/package.json': '{"a":1}',
      'package.json': '{}',
      'a/deep/package.json': '{}',
      'a/package.json': '{}',
    })

    const files = await Detect.walkProject(list, keeps, 4)

    expect([...files]).toEqual([
      ['package.json', 2],
      ['a/package.json', 2],
      ['z/package.json', 7],
      ['a/deep/package.json', 2],
    ])
  })

  test('the listing budget stops the walk with one debug line', async () => {
    const { list, lists, logs } = Fixtures.listerOn(
      {
        'a/package.json': '{}',
        'b/package.json': '{}',
        'c/package.json': '{}',
        'd/package.json': '{}',
      },
      3,
    )

    const files = await Detect.walkProject(list, keeps, 4)

    expect(lists).toEqual(['/repo', '/repo/a', '/repo/b'])
    expect([...files.keys()]).toEqual(['a/package.json', 'b/package.json'])
    expect(logs).toEqual(['stopped listing after 3 directories'])
  })

  test('a directory that cannot be listed is logged and skipped', async () => {
    const { list, host, logs } = Fixtures.listerOn({
      'a/package.json': '{}',
      'b/package.json': '{}',
    })
    const listDir = host.listDir

    host.listDir = async path => {
      if (path === '/repo/a') {
        throw new Error('EACCES')
      }

      return listDir(path)
    }

    const files = await Detect.walkProject(list, keeps, 4)

    expect([...files.keys()]).toEqual(['b/package.json'])
    expect(logs).toEqual(['could not list a: EACCES'])
  })
})
