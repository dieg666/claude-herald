import { resizeBand } from '../band/resize-band.js'
import { DEFAULT_SETTINGS } from '../defaults/default-settings.js'
import { FACTORY_SOURCES } from '../defaults/factory-sources.js'
import type { Host } from '../host/host.js'
import { bandSizeOf } from '../store/band-size-of.js'
import { loadSaved } from '../store/load-saved.js'
import { loadSources } from '../store/load-sources.js'
import { saveSettings } from '../store/save-settings.js'
import { saveSources } from '../store/save-sources.js'
import type { CommandReply } from './command-reply.js'
import { dropSources } from './drop-sources.js'
import { mirrorSummaries } from './mirror-summaries.js'

/**
 * `/herald reset`: the factory sources and the default settings again, added sources and what they left behind dropped, saved items kept, the band's selected item kept selected at the default size; asks for the refresh timer and the band's rotation to restart, which also summarizes the items shown in the default language.
 *
 * @param host the engine
 */
export async function resetHerald(host: Host): Promise<CommandReply> {
  const factory = FACTORY_SOURCES.map(source => ({ ...source }))
  const factoryIds = new Set(factory.map(source => source.id))

  // Re-anchored over the list before any source is dropped, so the size change keeps the item.
  await resizeBand(
    host,
    bandSizeOf((await host.state.settings.read()).bandSize),
    DEFAULT_SETTINGS.bandSize,
  )

  const added = (await loadSources(host)).filter(source => !factoryIds.has(source.id))

  await saveSources(host, factory)
  await host.state.sources.update(() => factory)
  await dropSources(
    host,
    added.map(source => source.id),
  )

  const settings = { ...DEFAULT_SETTINGS }

  await saveSettings(host, settings)
  await host.state.settings.update(() => settings)
  await mirrorSummaries(host, settings)

  const saved = (await loadSaved(host)).length

  return {
    text: [
      `Restored the ${factory.length} factory sources and the default settings`,
      added.length === 0
        ? ''
        : `, removed ${added.length} added ${added.length === 1 ? 'source' : 'sources'}`,
      `; kept ${saved} saved ${saved === 1 ? 'item' : 'items'}.`,
    ].join(''),
    restartRefresh: true,
    restartRotation: true,
  }
}
