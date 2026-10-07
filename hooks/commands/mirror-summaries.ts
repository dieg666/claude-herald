import type { Settings } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { loadSummaries } from '../store/load-summaries.js'
import { summariesFor } from '../store/summaries-for.js'
import { summaryLangOf } from '../store/summary-lang-of.js'

/**
 * Mirrors to state the cached one-line summaries in the language the settings resolve to.
 *
 * @param host the engine
 * @param settings the settings now
 */
export async function mirrorSummaries(host: Host, settings: Settings): Promise<void> {
  const userLanguage =
    settings.lang === 'user' ? await host.userLanguage().catch(() => undefined) : undefined

  const summaries = summariesFor(
    await loadSummaries(host),
    summaryLangOf(settings.lang, userLanguage),
  )

  await host.state.summaries.update(() => summaries)
}
