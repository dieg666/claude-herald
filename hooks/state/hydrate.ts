import type { HeraldState } from './herald-state.js'
import type { Host } from '../host/host.js'
import { loadItems } from '../store/load-items.js'
import { loadSaved } from '../store/load-saved.js'
import { loadSettings } from '../store/load-settings.js'
import { loadSources } from '../store/load-sources.js'
import { loadSummaries } from '../store/load-summaries.js'
import { summariesFor } from '../store/summaries-for.js'
import { summaryLangOf } from '../store/summary-lang-of.js'

/**
 * What hydrate copies from the store into `$.state`.
 */
type Hydrated = Pick<HeraldState, 'sources' | 'settings' | 'items' | 'saved' | 'summaries'>

/**
 * Copies the store into `$.state` (sources, settings, items, saved, current-language short summaries), reading all before writing any; never throws, logs a failure to debug.
 *
 * @param host the engine
 * @returns what it wrote, or undefined when it failed
 */
export async function hydrate(host: Host): Promise<Hydrated | undefined> {
  try {
    const sources = await loadSources(host)
    const settings = await loadSettings(host)
    const items = await loadItems(host)
    const saved = await loadSaved(host)
    const entries = await loadSummaries(host)

    const userLanguage =
      settings.lang === 'user' ? await host.userLanguage().catch(() => undefined) : undefined

    const summaries = summariesFor(entries, summaryLangOf(settings.lang, userLanguage))

    await host.state.sources.update(() => sources)
    await host.state.settings.update(() => settings)
    await host.state.items.update(() => items)
    await host.state.saved.update(() => saved)
    await host.state.summaries.update(() => summaries)

    return { sources, settings, items, saved, summaries }
  } catch (error) {
    host.debug(
      `herald: could not load the store: ${error instanceof Error ? error.message : String(error)}`,
    )

    return undefined
  }
}
