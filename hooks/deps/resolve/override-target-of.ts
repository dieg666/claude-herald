import { githubRepoOf } from './github-repo-of.js'
import { shorthandRepoOf } from './shorthand-repo-of.js'

/**
 * What an override names: a GitHub repository (`owner/repo` or a github.com repository URL), or a feed URL (any other http(s) URL, a `.atom`, `.rss` or `.xml` one on GitHub included); undefined for anything else.
 *
 * @param target what the user wrote
 */
export function overrideTargetOf(target: string): { repo: string } | { feed: string } | undefined {
  const text = target.trim()

  if (/^https?:\/\/[^\s/?#]+[^\s]*$/i.test(text)) {
    const path = /^https?:\/\/[^/?#]+([^?#]*)/i.exec(text)?.[1] ?? ''
    const repo = /\.(?:atom|rss|xml)$/i.test(path) ? undefined : githubRepoOf(text)

    return repo === undefined ? { feed: text } : { repo }
  }

  const repo = /^[\w-]+\/[\w.-]+$/.test(text) ? shorthandRepoOf(text) : undefined

  return repo === undefined ? undefined : { repo }
}
