import { githubRepoOf } from './github-repo-of.js'
import type { Lookup } from './lookup.js'

/**
 * The first GitHub repository among a package's metadata URLs, best first, or why there is none (naming the first URL, when it points elsewhere).
 *
 * @param urls the metadata's URL fields in order of preference, absent and non-text ones included
 * @param repoOf reads a repository from one URL
 */
export function repoLookupOf(
  urls: readonly unknown[],
  repoOf: (url: string) => string | undefined = githubRepoOf,
): Lookup {
  const texts = urls.flatMap(url =>
    typeof url === 'string' && url.trim() !== '' ? [url.trim()] : [],
  )

  for (const url of texts) {
    const repo = repoOf(url)

    if (repo !== undefined) {
      return { kind: 'repo', repo }
    }
  }

  return {
    kind: 'none',
    reason:
      texts[0] === undefined
        ? 'no repository in the registry metadata'
        : `repository not on GitHub: ${texts[0]}`,
  }
}
