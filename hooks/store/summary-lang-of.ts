import type { SummaryLang } from '../../types/index.js'

/**
 * The language summaries are written and cached in: `feed` (each item's own), Claude Code's language for `user` (`feed` while it is unset), else the fixed code.
 *
 * @param lang the setting
 * @param userLanguage Claude Code's `language` setting, when set
 */
export function summaryLangOf(lang: SummaryLang, userLanguage: string | undefined): string {
  if (lang !== 'user') {
    return lang
  }

  const user = userLanguage?.trim() ?? ''

  return user === '' ? 'feed' : user
}
