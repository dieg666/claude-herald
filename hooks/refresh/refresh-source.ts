import type { Item, Source } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { mergeItems } from '../items/merge-items.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { loadItems } from '../store/load-items.js'
import { loadSeen } from '../store/load-seen.js'
import { markSeen } from '../store/mark-seen.js'
import { saveItems } from '../store/save-items.js'
import { savePageHash } from '../store/save-page-hash.js'
import { sourcesOf } from '../store/sources-of.js'
import { fetchFeed } from './fetch-feed.js'
import { fetchPage } from './fetch-page.js'
import { messageOf } from './message-of.js'
import type { SourceOutcome } from './source-outcome.js'

/**
 * The items a source had not seen, marked seen now; on its first load all of them are marked and none is new.
 *
 * @param host the engine
 * @param sourceId the source
 * @param items its items as kept now
 */
async function newItemsOf(host: Host, sourceId: string, items: readonly Item[]): Promise<Item[]> {
  const seen = (await loadSeen(host))[sourceId]

  if (seen === undefined) {
    // A first load with nothing in it stays a first load, so a later backlog stays silent.
    if (items.length > 0) {
      await markSeen(
        host,
        sourceId,
        items.map(item => item.id),
      )
    }

    return []
  }

  const known = new Set(seen)
  const fresh = items.filter(item => !known.has(item.id))

  if (fresh.length > 0) {
    await markSeen(
      host,
      sourceId,
      fresh.map(item => item.id),
    )
  }

  return fresh
}

/**
 * Refreshes one source: reads it, merges into its kept items, marks the new ones seen, saves the items and mirrors them to state, unless the source was removed or turned off meanwhile; on failure keeps the last items and logs one debug line; never throws.
 *
 * @param host the engine
 * @param source the source
 * @param signal aborts a page's model call
 * @param serially runs the store and state writes, queued behind those of the other sources of the run
 */
export async function refreshSource(
  host: Host,
  source: Source,
  signal?: AbortSignal,
  serially: <T>(task: () => Promise<T>) => Promise<T> = task => task(),
): Promise<SourceOutcome> {
  try {
    const fetched =
      source.kind === 'page' ? await fetchPage(host, source, signal) : await fetchFeed(host, source)

    if (fetched.kind === 'failed') {
      host.debug(`news: ${source.name}: ${fetched.reason}`)

      return { newItems: [], error: fetched.reason }
    }

    return await serially(async () => {
      const sources = sourcesOf(await host.storeGet(STORE_KEYS.sources))

      // A source removed or turned off while it was fetched keeps nothing from this fetch.
      if (
        sources !== undefined &&
        !sources.some(other => other.id === source.id && other.isEnabled)
      ) {
        return { newItems: [] }
      }

      const kept = (await loadItems(host))[source.id] ?? []
      const items = fetched.kind === 'unchanged' ? kept : mergeItems(kept, fetched.items)

      // Seen first: a write that fails after it cannot make the same items new again.
      const newItems = await newItemsOf(host, source.id, items)

      if (fetched.kind === 'items') {
        await saveItems(host, source.id, items)

        if (fetched.pageHash !== undefined) {
          await savePageHash(host, source.id, fetched.pageHash)
        }
      }

      await host.state.items.update(current => ({ ...current, [source.id]: items }))

      return { newItems }
    })
  } catch (error) {
    const reason = messageOf(error)

    host.debug(`news: ${source.name}: ${reason}`)

    return { newItems: [], error: reason }
  }
}
