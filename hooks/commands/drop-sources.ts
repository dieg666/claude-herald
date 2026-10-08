import type { Host } from '../host/host.js'
import { forgetSources } from '../store/forget-sources.js'
import { withoutKeys } from './without-keys.js'

/**
 * Forgets what removed sources left behind (items, seen ids, page hashes) in the store, and their items, last errors and last clean refresh times in state.
 *
 * @param host the engine
 * @param sourceIds the sources removed
 */
export async function dropSources(host: Host, sourceIds: readonly string[]): Promise<void> {
  if (sourceIds.length === 0) {
    return
  }

  await forgetSources(host, sourceIds)
  await host.state.items.update(items => withoutKeys(items, sourceIds))
  await host.state.status.update(status => ({
    ...status,
    errors: withoutKeys(status.errors, sourceIds),
    refreshedAt: withoutKeys(status.refreshedAt ?? {}, sourceIds),
  }))
}
