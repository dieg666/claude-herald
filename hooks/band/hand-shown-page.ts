import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { bandItemsOf } from './band-items-of.js'
import { bandPageOf } from './band-page-of.js'
import { handPage } from './hand-page.js'
import type { Rotation } from './rotation.js'

/**
 * Hands the page the band shows now to the rotation's `onPage`, not waiting; never throws.
 *
 * @param host the engine
 * @param rotation the rotation
 * @param signal aborts what `onPage` starts
 * @returns the page's items
 */
export async function handShownPage(
  host: Host,
  rotation: Rotation,
  signal?: AbortSignal,
): Promise<readonly Item[]> {
  try {
    const items = bandItemsOf(await host.state.sources.read(), await host.state.items.read())
    const page = bandPageOf(await host.state.band.read(), items)

    handPage(host, rotation, page.items, signal)

    return page.items
  } catch (error) {
    host.debug(`news: band: ${messageOf(error)}`)

    return []
  }
}
