import type { Source } from '../../types/index.js'
import { FACTORY_SOURCES } from '../defaults/factory-sources.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { sourcesOf } from './sources-of.js'

/**
 * A message for a debug line.
 *
 * @param error what was thrown
 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The stored sources; the factory sources when nothing is stored (seeded into the store, a failed write only logged) or when the stored value is not a list (logged, the store left as it is).
 *
 * @param host the engine
 */
export async function loadSources(host: Host): Promise<Source[]> {
  const value = await host.storeGet(STORE_KEYS.sources)
  const stored = sourcesOf(value)

  if (stored !== undefined) {
    return stored
  }

  const factory = FACTORY_SOURCES.map(source => ({ ...source }))

  if (value !== undefined && value !== null) {
    host.debug('news: the stored sources are not a list; showing the factory sources')

    return factory
  }

  try {
    await host.storeSet(STORE_KEYS.sources, factory)
  } catch (error) {
    host.debug(`news: could not save the factory sources: ${messageOf(error)}`)
  }

  return factory
}
