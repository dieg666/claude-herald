import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Fixtures from '../fixtures'

describe('deps-root-of', () => {
  test('the git root above the session, a repository', async () => {
    const fake = Fixtures.fakeHostOf()

    Object.assign(fake.host, Fixtures.fakeFsOf('/repo', { '.git': { isDir: true } }, '/repo/src'))

    expect(await Commands.depsRootOf(fake.host)).toEqual({ root: '/repo', isRepo: true })
  })

  test('outside a repository the session root, not a repository; at a filesystem root a reply', async () => {
    const fake = Fixtures.fakeHostOf()

    expect(await Commands.depsRootOf(fake.host)).toEqual({ root: '/work', isRepo: false })

    fake.host.sessionRoot = async () => '/'

    expect(await Commands.depsRootOf(fake.host)).toEqual({
      reply: {
        text: 'The session runs at a filesystem root, so /news deps has no project to follow.',
      },
    })
  })
})
