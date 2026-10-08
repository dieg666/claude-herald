import type { HeraldState } from './herald-state.js'
import type { Host } from '../host/host.js'
import { mergeItems } from '../items/merge-items.js'
import { loadItems } from '../store/load-items.js'
import { loadRead } from '../store/load-read.js'
import { loadRefreshedAt } from '../store/load-refreshed-at.js'
import { loadSaved } from '../store/load-saved.js'
import { loadSettings } from '../store/load-settings.js'
import { loadSources } from '../store/load-sources.js'
import { loadSummaries } from '../store/load-summaries.js'
import { loadViewed } from '../store/load-viewed.js'
import { summariesFor } from '../store/summaries-for.js'
import { summaryLangOf } from '../store/summary-lang-of.js'

/**
 * What hydrate copies from the store into `$.state`.
 */
type Hydrated = Pick<
  HeraldState,
  'sources' | 'settings' | 'items' | 'saved' | 'summaries' | 'read' | 'viewed'
>

/**
 * Copies the store into `$.state` (sources, settings, items with duplicates of one story folded, saved, current-language short summaries, read and viewed ids, when each source last refreshed cleanly), reading all before writing any; never throws, logs a failure to debug.
 *
 * @param host the engine
 * @returns what it wrote, or undefined when it failed
 */
export async function hydrate(host: Host): Promise<Hydrated | undefined> {
  try {
    const sources = await loadSources(host)
    const settings = await loadSettings(host)
    const items = Object.fromEntries(
      Object.entries(await loadItems(host)).map(([id, list]) => [id, mergeItems(list, [])]),
    )
    const saved = await loadSaved(host)
    const entries = await loadSummaries(host)
    const read = await loadRead(host)
    const viewed = await loadViewed(host)
    const refreshedAt = await loadRefreshedAt(host)

    const userLanguage =
      settings.lang === 'user' ? await host.userLanguage().catch(() => undefined) : undefined

    const summaries = summariesFor(entries, summaryLangOf(settings.lang, userLanguage))

    await host.state.sources.update(() => sources)
    await host.state.settings.update(() => settings)
    await host.state.items.update(() => items)
    await host.state.saved.update(() => saved)
    await host.state.summaries.update(() => summaries)
    await host.state.read.update(() => read)
    await host.state.viewed.update(() => viewed)
    await host.state.status.update(status => ({
      ...status,
      refreshedAt: { ...refreshedAt, ...status.refreshedAt },
    }))

    return { sources, settings, items, saved, summaries, read, viewed }
  } catch (error) {
    host.debug(
      `herald: could not load the store: ${error instanceof Error ? error.message : String(error)}`,
    )

    return undefined
  }
}
