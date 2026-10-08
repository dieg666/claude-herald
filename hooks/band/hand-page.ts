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
 */
export function handPage(host: Host, rotation: Rotation, items: readonly Item[]): void {
  if (items.length === 0) {
    return
  }

  rotation.onPage(host, items).catch((error: unknown) => {
    host.debug(`news: band: ${messageOf(error)}`)
  })
}
