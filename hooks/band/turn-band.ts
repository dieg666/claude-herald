import type { BandState, Item } from '../../types/index.js'
import { shownStackItemsOf } from '../deps/stack/shown-stack-items-of.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { bandAfter } from './band-after.js'
import { bandItemsOf } from './band-items-of.js'
import type { BandMove } from './band-move.js'
import { bandPageOf } from './band-page-of.js'
import { handPage } from './hand-page.js'
import type { Rotation } from './rotation.js'

/**
 * Whether two band states are the same.
 *
 * @param a one state
 * @param b the other
 */
function isSame(a: BandState, b: BandState): boolean {
  return a.offset === b.offset && a.selected === b.selected && a.isPaused === b.isPaused
}

/**
 * Applies a move to the band in state (nothing written when it changes nothing) and, when the page changed, hands the new page to the rotation's `onPage`; never throws.
 *
 * @param host the engine
 * @param rotation the rotation
 * @param move what happened
 * @returns the new page's items when the page changed, else undefined
 */
export async function turnBand(
  host: Host,
  rotation: Rotation,
  move: BandMove,
): Promise<readonly Item[] | undefined> {
  try {
    const items = bandItemsOf(
      await host.state.sources.read(),
      await host.state.items.read(),
      shownStackItemsOf(await host.state.stack.read()),
    )
    const before = await host.state.band.read()

    if (isSame(before, bandAfter(before, move, items.length))) {
      return undefined
    }

    const after = await host.state.band.update(band => bandAfter(band, move, items.length))
    const page = bandPageOf(after, items)

    if (page.span.start === bandPageOf(before, items).span.start) {
      return undefined
    }

    handPage(host, rotation, page.items)

    return page.items
  } catch (error) {
    host.debug(`news: band: could not ${move}: ${messageOf(error)}`)

    return undefined
  }
}
