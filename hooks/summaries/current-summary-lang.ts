import type { Host } from '../host/host.js'
import { loadSettings } from '../store/load-settings.js'
import { summaryLangOf } from '../store/summary-lang-of.js'

/**
 * The resolved language summaries are written and cached in now, from the stored settings; `user` reads Claude Code's `language` setting and falls back to `feed` when it is unset or unreadable.
 *
 * @param host the engine
 */
export async function currentSummaryLang(host: Host): Promise<string> {
  const { lang } = await loadSettings(host)
  const userLanguage =
    lang === 'user' ? await host.userLanguage().catch(() => undefined) : undefined

  return summaryLangOf(lang, userLanguage)
}
