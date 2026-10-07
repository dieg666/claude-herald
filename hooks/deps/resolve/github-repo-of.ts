import { GITHUB_RESERVED_OWNERS } from './github-reserved-owners.js'

/**
 * The host and path of a URL in any of the forms manifests and registries write: `git+https://`, `git://`, `ssh://user@host/`, scp-like `user@host:path`, `github:owner/repo`, or a scheme-less `github.com/...`.
 *
 * @param text the URL as written
 */
function hostAndPathOf(text: string): { host: string; path: string } | undefined {
  const url = text.trim().replace(/^git\+/i, '')
  const shorthand = /^github:(.*)$/i.exec(url)

  if (shorthand !== null) {
    return { host: 'github.com', path: (shorthand[1] ?? '').replace(/[?#].*$/, '') }
  }

  const scp = /^[\w.-]+@([\w.-]+):(?!\/\/)(.*)$/.exec(url)

  if (scp !== null) {
    return { host: scp[1] ?? '', path: (scp[2] ?? '').replace(/[?#].*$/, '') }
  }

  const full = /^(?:[a-z][a-z\d+.-]*:)?\/\/(?:[^@/?#]*@)?([^/:?#]+)(?::\d*)?([^?#]*)/i.exec(url)

  if (full !== null) {
    return { host: full[1] ?? '', path: full[2] ?? '' }
  }

  const bare = /^((?:www\.)?github\.com)(\/[^?#]*)/i.exec(url)

  return bare === null ? undefined : { host: bare[1] ?? '', path: bare[2] ?? '' }
}

/**
 * A URL's GitHub repository as `owner/repo`, case as written, from any git URL form, with `.git`, `@ref`, `tree/` paths, queries and fragments dropped; undefined for another host or a GitHub page that is not a repository.
 *
 * @param url a repository, homepage or source URL
 */
export function githubRepoOf(url: string): string | undefined {
  const parts = hostAndPathOf(url)

  if (parts === undefined || parts.host.toLowerCase().replace(/^www\./, '') !== 'github.com') {
    return undefined
  }

  const [owner = '', name = ''] = parts.path.split('/').filter(segment => segment !== '')
  const repo = name.replace(/@.*$/, '').replace(/\.git$/i, '')

  if (
    !/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(owner) ||
    GITHUB_RESERVED_OWNERS.has(owner.toLowerCase()) ||
    !/^[\w.-]+$/.test(repo) ||
    /^\.+$/.test(repo)
  ) {
    return undefined
  }

  return `${owner}/${repo}`
}
