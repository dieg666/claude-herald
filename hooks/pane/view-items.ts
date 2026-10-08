import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { STACK_TAB } from '../names/stack-tab.js'
import { messageOf } from '../refresh/message-of.js'
import { addViewed } from '../store/add-viewed.js'
import { loadViewed } from '../store/load-viewed.js'

/**
 * Records the given items as viewed, per source, in the store and then in state, so those sources' new counts fall; the stack's releases are not counted items and a source with no viewed ids yet has no baseline, so both are left alone; a failure is logged to debug, never thrown.
 *
 * @param host the engine
 * @param items the items drawn, from any sources
 */
export async function viewItems(host: Host, items: readonly Item[]): Promise<void> {
  try {
    const baselines = await loadViewed(host)
    const bySource = new Map<string, string[]>()

    for (const item of items) {
      if (item.sourceId !== STACK_TAB && Object.hasOwn(baselines, item.sourceId)) {
        bySource.set(item.sourceId, [...(bySource.get(item.sourceId) ?? []), item.id])
      }
    }

    let viewed: Awaited<ReturnType<typeof addViewed>> | undefined

    for (const [sourceId, ids] of bySource) {
      viewed = await addViewed(host, sourceId, ids)
    }

    if (viewed !== undefined) {
      const latest = viewed

      await host.state.viewed.update(() => latest)
    }
  } catch (error) {
    host.debug(`herald: pane: could not record the items as viewed: ${messageOf(error)}`)
  }
}
