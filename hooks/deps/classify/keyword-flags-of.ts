import type { ReleaseFlags } from '../../../types/index.js'

/** Not right after a negation (`no breaking changes`, `non-security`), nor inside a longer word (`unbreaking`). */
const WORD_START = String.raw`(?<!\b(?:no|non|not|without)[\s-]+)(?<![\w-])`

const BREAKING = new RegExp(String.raw`${WORD_START}breaking\b`, 'i')

const SECURITY = [
  /\bCVE-\d/i,
  /\bGHSA-/i,
  new RegExp(String.raw`${WORD_START}(?:security|vulnerability|vulnerabilities)\b`, 'i'),
]

/**
 * The flags a release's title and notes raise by keyword alone: breaking for `breaking` (`BREAKING CHANGE` included), security for a CVE or GHSA id, `security` or `vulnerability`; whole words, any case, not right after a negation.
 *
 * @param text the title and notes
 */
export function keywordFlagsOf(text: string): ReleaseFlags {
  return {
    breaking: BREAKING.test(text),
    security: SECURITY.some(pattern => pattern.test(text)),
  }
}
