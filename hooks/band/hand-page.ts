import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import type { Rotation } from './rotation.js'

/**
 * Hands a page's items to the rotation's `onPage` without waiting, a failure logged to debug.
 *
 * @param host the engine
 * @param rotation the rotation
 * @param items the page's items
 * @param signal aborts what `onPage` starts
 */
export function handPage(
  host: Host,
  rotation: Rotation,
  items: readonly Item[],
  signal?: AbortSignal,
): void {
  if (items.length === 0) {
    return
  }

  rotation.onPage(host, items, signal).catch((error: unknown) => {
    host.debug(`news: band: ${messageOf(error)}`)
  })
}
