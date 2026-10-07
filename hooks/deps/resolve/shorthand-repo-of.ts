import { githubRepoOf } from './github-repo-of.js'

/**
 * A GitHub repository from a bare `owner/repo` (npm's shorthand, an override's target) or any URL `githubRepoOf` reads.
 *
 * @param text what was written
 */
export function shorthandRepoOf(text: string): string | undefined {
  const bare = /^([\w-]+\/[\w.-]+?)(?:\.git)?(?:#.*)?$/.exec(text.trim())

  return githubRepoOf(bare === null ? text : `https://github.com/${bare[1] ?? ''}`)
}
