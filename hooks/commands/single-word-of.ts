import { wordsOf } from './words-of.js'

/**
 * What follows a subcommand as one word, quotes removed, when it is exactly one and holds no whitespace (no package name, repository, URL or Maven coordinate does); undefined otherwise.
 *
 * @param rest what follows the subcommand
 */
export function singleWordOf(rest: string): string | undefined {
  const words = wordsOf(rest)
  const [word] = words

  return words.length === 1 && word !== undefined && word !== '' && !/\s/.test(word)
    ? word
    : undefined
}
