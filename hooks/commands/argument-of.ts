import { wordsOf } from './words-of.js'

/**
 * Everything after a subcommand as one argument: its words, quotes removed, joined by single spaces.
 *
 * @param rest what follows the subcommand
 */
export function argumentOf(rest: string): string {
  return wordsOf(rest).join(' ').trim()
}
