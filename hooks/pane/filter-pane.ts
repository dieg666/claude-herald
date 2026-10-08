import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { handShownPane } from './hand-shown-pane.js'
import type { PaneShown } from './pane-shown.js'

/**
 * Sets the stack tab's filter in state (one line of at most 100 characters, spaces kept as typed; the selection back at the top when it changed), then hands the items shown to `onShown`, not waiting; never throws.
 *
 * @param host the engine
 * @param value the text typed
 * @param size how many items the window may show
 * @param onShown what checks the items shown
 * @returns the items shown now
 */
export async function filterPane(
  host: Host,
  value: string,
  size: number,
  onShown: PaneShown,
): Promise<readonly Item[]> {
  try {
    const filter = value.replace(/[\r\n\t]+/g, ' ').slice(0, 100)
    const before = await host.state.stack.read()

    if (before.filter !== filter) {
      await host.state.stack.update(stack => ({ ...stack, filter }))
      await host.state.pane.update(pane => ({ ...pane, selected: 0 }))
    }

    return await handShownPane(host, size, onShown)
  } catch (error) {
    host.debug(`herald: pane: could not filter: ${messageOf(error)}`)

    return []
  }
}
