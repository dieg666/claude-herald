import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { handPaneItems } from './hand-pane-items.js'
import { panePageOf } from './pane-page-of.js'
import { paneStackOf } from './pane-stack-of.js'
import type { PaneShown } from './pane-shown.js'
import { shownSelectedFirstOf } from './shown-selected-first-of.js'

/**
 * Hands the items the pane shows now, in a window of `size`, to `onShown`, the selected one first, not waiting; never throws.
 *
 * @param host the engine
 * @param size how many items the window may show
 * @param onShown what summarizes them
 * @returns the items shown
 */
export async function handShownPane(
  host: Host,
  size: number,
  onShown: PaneShown,
): Promise<readonly Item[]> {
  try {
    const page = panePageOf(
      await host.state.pane.read(),
      await host.state.sources.read(),
      await host.state.items.read(),
      await host.state.saved.read(),
      size,
      paneStackOf(await host.state.stack.read()),
      {},
      await host.state.status.read(),
    )

    handPaneItems(host, onShown, shownSelectedFirstOf(page))

    return page.shown
  } catch (error) {
    host.debug(`herald: pane: ${messageOf(error)}`)

    return []
  }
}
