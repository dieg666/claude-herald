import type { BandState, Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { bandAfter } from './band-after.js'
import type { BandMove } from './band-move.js'
import { bandPageOf } from './band-page-of.js'
import { handPage } from './hand-page.js'
import type { Rotation } from './rotation.js'
import { shownBandOf } from './shown-band-of.js'

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
 * Applies a move to the band in state, over pages of the size the band shows, which is one while it last drew compact; nothing is written when the move changes nothing, and when the page changed it hands the new page to the rotation's `onPage`; never throws.
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
    const { items, size } = await shownBandOf(host, rotation)
    const before = await host.state.band.read()

    if (isSame(before, bandAfter(before, move, items.length, size))) {
      return undefined
    }

    const after = await host.state.band.update(band => bandAfter(band, move, items.length, size))
    const page = bandPageOf(after, items, size)

    if (page.span.start === bandPageOf(before, items, size).span.start) {
      return undefined
    }

    handPage(host, rotation, page.items)

    return page.items
  } catch (error) {
    host.debug(`herald: band: could not ${move}: ${messageOf(error)}`)

    return undefined
  }
}
