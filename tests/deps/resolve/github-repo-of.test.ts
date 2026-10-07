import { describe, expect, test } from 'claude-code/testing'

import Resolve from '../../../hooks/deps/resolve'

describe('github-repo-of', () => {
  for (const [url, repo] of [
    ['https://github.com/psf/requests', 'psf/requests'],
    ['git+https://github.com/react/react.git', 'react/react'],
    ['git://github.com/owner/repo.git', 'owner/repo'],
    ['git@github.com:FasterXML/jackson-databind.git', 'FasterXML/jackson-databind'],
    ['ssh://git@github.com/owner/repo.git', 'owner/repo'],
    ['git+ssh://git@github.com/owner/repo.git', 'owner/repo'],
    ['https://github.com/vuejs/core/tree/main/packages/compiler-sfc#readme', 'vuejs/core'],
    ['https://github.com/rails/rails/tree/v8.1.4', 'rails/rails'],
    ['https://github.com/Textualize/textual/issues', 'Textualize/textual'],
    ['http://www.github.com/Owner/Repo/', 'Owner/Repo'],
    ['HTTPS://GitHub.com/owner/repo?tab=readme', 'owner/repo'],
    ['git+https://github.com/owner/repo.git@v1.2.0#egg=pkg', 'owner/repo'],
    ['github:owner/repo', 'owner/repo'],
    ['github:owner/repo#semver:^1.2.0', 'owner/repo'],
    ['git@github.com:owner/repo.git#main', 'owner/repo'],
    ['github.com/owner/repo/v2', 'owner/repo'],
    ['https://github.com/owner/socket.io.git', 'owner/socket.io'],
  ] as const) {
    test(`${url} is ${repo}`, () => {
      expect(Resolve.githubRepoOf(url)).toBe(repo)
    })
  }

  for (const url of [
    'https://gitlab.com/owner/repo',
    'git@bitbucket.org:owner/repo.git',
    'https://github.com/sponsors/samuelcolvin',
    'https://github.com/orgs/owner/projects/1',
    'https://github.com/owner',
    'https://github.com/',
    'https://gist.github.com/owner/abc',
    'https://owner.github.io/repo',
    'https://github.com/owner/..',
    'https://notgithub.com/owner/repo',
    'gitlab:owner/repo',
    'owner/repo',
    '',
  ]) {
    test(`${url || 'an empty text'} is no GitHub repository`, () => {
      expect(Resolve.githubRepoOf(url)).toBeUndefined()
    })
  }

  test('a bare owner/repo is read only as a shorthand', () => {
    expect(Resolve.shorthandRepoOf('owner/repo')).toBe('owner/repo')
    expect(Resolve.shorthandRepoOf('owner/repo.git#v1')).toBe('owner/repo')
    expect(Resolve.shorthandRepoOf('git+https://github.com/o/r.git')).toBe('o/r')
    expect(Resolve.shorthandRepoOf('some.host/owner')).toBeUndefined()
  })
})
