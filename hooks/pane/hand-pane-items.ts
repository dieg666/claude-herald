import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import type { PaneShown } from './pane-shown.js'

/**
 * Hands the items the pane shows to `onShown` without waiting, a failure logged to debug.
 *
 * @param host the engine
 * @param onShown what summarizes them
 * @param items the items shown
 */
export function handPaneItems(host: Host, onShown: PaneShown, items: readonly Item[]): void {
  if (items.length === 0) {
    return
  }

  onShown(host, items).catch((error: unknown) => {
    host.debug(`news: pane: ${messageOf(error)}`)
  })
}
