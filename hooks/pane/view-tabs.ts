import type { Host } from '../host/host.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import { messageOf } from '../refresh/message-of.js'
import { addViewed } from '../store/add-viewed.js'

/**
 * Records the items each of those source tabs holds now as viewed, in the store and then in state, so their new counts start over; the stack and saved tabs are skipped; a failure is logged to debug, never thrown.
 *
 * @param host the engine
 * @param tabIds the tabs shown, or left
 */
export async function viewTabs(host: Host, tabIds: readonly string[]): Promise<void> {
  try {
    const items = await host.state.items.read()

    for (const id of new Set(tabIds)) {
      if (id === SAVED_TAB || id === STACK_TAB || !Object.hasOwn(items, id)) {
        continue
      }

      const viewed = await addViewed(
        host,
        id,
        (items[id] ?? []).map(item => item.id),
      )

      await host.state.viewed.update(() => viewed)
    }
  } catch (error) {
    host.debug(`herald: pane: could not record the tab as viewed: ${messageOf(error)}`)
  }
}
