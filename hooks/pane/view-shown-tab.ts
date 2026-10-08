import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { panePageOf } from './pane-page-of.js'
import { paneStackOf } from './pane-stack-of.js'
import { viewTabs } from './view-tabs.js'

/**
 * Records the tab the pane shows now as viewed; never throws.
 *
 * @param host the engine
 */
export async function viewShownTab(host: Host): Promise<void> {
  try {
    const page = panePageOf(
      await host.state.pane.read(),
      await host.state.sources.read(),
      await host.state.items.read(),
      await host.state.saved.read(),
      1,
      paneStackOf(await host.state.stack.read()),
    )

    await viewTabs(host, [page.tab.id])
  } catch (error) {
    host.debug(`herald: pane: ${messageOf(error)}`)
  }
}
