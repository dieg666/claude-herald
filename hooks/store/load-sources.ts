import type { Source } from '../../types/index.js'
import { FACTORY_SOURCES } from '../defaults/factory-sources.js'
import type { Host } from '../host/host.js'
import { STORE_KEYS } from '../names/store-keys.js'
import { sourcesOf } from './sources-of.js'

/**
 * The stored sources; on a first run (nothing stored) the factory sources, saved so later runs read the user's own list, even an empty one.
 *
 * @param host the engine
 */
export async function loadSources(host: Host): Promise<Source[]> {
  const stored = sourcesOf(await host.storeGet(STORE_KEYS.sources))

  if (stored !== undefined) {
    return stored
  }

  const seeded = FACTORY_SOURCES.map(source => ({ ...source }))

  await host.storeSet(STORE_KEYS.sources, seeded)

  return seeded
}
