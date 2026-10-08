import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { ALL_TAB } from '../names/all-tab.js'
import { panePageOf } from './pane-page-of.js'
import { paneStackOf } from './pane-stack-of.js'
import { viewItems } from './view-items.js'
import { viewTabs } from './view-tabs.js'

/**
 * Records what the pane shows now as viewed: a source tab's items, or the rows in the All tab's window of `size`; never throws.
 *
 * @param host the engine
 * @param size how many items the window may show
 */
export async function viewShownTab(host: Host, size: number): Promise<void> {
  try {
    const page = panePageOf(
      await host.state.pane.read(),
      await host.state.sources.read(),
      await host.state.items.read(),
      await host.state.saved.read(),
      size,
      paneStackOf(await host.state.stack.read()),
    )

    if (page.tab.id === ALL_TAB) {
      await viewItems(host, page.shown)
    } else {
      await viewTabs(host, [page.tab.id])
    }
  } catch (error) {
    host.debug(`herald: pane: ${messageOf(error)}`)
  }
}
