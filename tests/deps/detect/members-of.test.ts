import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'
import Fixtures from '../../fixtures'

describe('members-of', () => {
  const workspaceOf = (include: string[], exclude: string[] = []) => ({
    dir: '',
    include,
    exclude,
    manifest: 'package.json',
  })

  test('dir/* matches the directories holding the manifest; explicit paths match one', async () => {
    const { list } = Fixtures.listerOn({
      'packages/a/package.json': '{}',
      'packages/b/package.json': '{}',
      'packages/empty/README.md': '',
      'docs/package.json': '{}',
    })

    const members = await Detect.membersOf(
      workspaceOf(['packages/*', './docs/']),
      list,
      4,
      () => {},
    )

    expect([...members.keys()]).toEqual([
      'packages/a/package.json',
      'packages/b/package.json',
      'docs/package.json',
    ])
  })

  test('patterns that leave the project are skipped and nothing outside is listed', async () => {
    const { list, lists } = Fixtures.listerOn({ 'packages/a/package.json': '{}' })
    const logs: string[] = []

    const members = await Detect.membersOf(
      workspaceOf(['../other/*', '/etc', 'packages/../../x', '~/code']),
      list,
      4,
      text => logs.push(text),
    )

    expect([...members.keys()]).toEqual([])
    expect(lists).toEqual([])
    expect(logs.length).toBe(4)
    expect(logs[0]).toBe("skipped workspace member '../other/*' of .: outside the project")
  })

  test('linked directories are never followed, by glob or by name', async () => {
    const { list, lists } = Fixtures.listerOn({
      'packages/real/package.json': '{}',
      'packages/linked': { isLink: true },
      shared: { isLink: true },
    })

    const members = await Detect.membersOf(workspaceOf(['packages/*', 'shared']), list, 4, () => {})

    expect([...members.keys()]).toEqual(['packages/real/package.json'])
    expect(lists).not.toContain('/repo/packages/linked')
    expect(lists).not.toContain('/repo/shared')
  })

  test('a manifest that is a link does not make a member', async () => {
    const { list } = Fixtures.listerOn({ 'packages/a/package.json': { isLink: true } })

    expect([
      ...(await Detect.membersOf(workspaceOf(['packages/*']), list, 4, () => {})).keys(),
    ]).toEqual([])
  })

  test('skipped names are never matched by a glob', async () => {
    const { list, lists } = Fixtures.listerOn({
      'packages/node_modules/package.json': '{}',
      'packages/.hidden/package.json': '{}',
      'packages/ok/package.json': '{}',
    })

    const members = await Detect.membersOf(workspaceOf(['packages/*']), list, 4, () => {})

    expect([...members.keys()]).toEqual(['packages/ok/package.json'])
    expect(lists).not.toContain('/repo/packages/node_modules')
  })

  test('** descends at most the depth bound; exclusions drop matches', async () => {
    const { list } = Fixtures.listerOn({
      'apps/web/package.json': '{}',
      'apps/web/e2e/package.json': '{}',
      'apps/a/b/c/package.json': '{}',
      'apps/a/b/c/d/e/package.json': '{}',
    })

    const members = await Detect.membersOf(workspaceOf(['apps/**'], ['**/e2e']), list, 3, () => {})

    expect([...members.keys()].sort()).toEqual(['apps/a/b/c/package.json', 'apps/web/package.json'])
  })

  test('patterns are relative to the workspace directory', async () => {
    const { list } = Fixtures.listerOn({ 'native/pkgs/a/pubspec.yaml': 'name: a' })

    const members = await Detect.membersOf(
      { dir: 'native', include: ['pkgs/a'], exclude: [], manifest: 'pubspec.yaml' },
      list,
      4,
      () => {},
    )

    expect([...members.keys()]).toEqual(['native/pkgs/a/pubspec.yaml'])
  })
})
