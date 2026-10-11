import { shownStackItemsOf } from '../deps/stack/shown-stack-items-of.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { bandItemsOf } from './band-items-of.js'
import { bandResized } from './band-resized.js'

/**
 * Brings the band in state inside pages of a new size, the selected item kept selected (`bandResized`); never throws, logs a failure to debug.
 *
 * @param host the engine
 * @param from how many items the full band showed at once
 * @param to how many it shows now
 */
export async function resizeBand(host: Host, from: number, to: number): Promise<void> {
  try {
    const sources = await host.state.sources.read()
    const items = await host.state.items.read()
    const stack = shownStackItemsOf(await host.state.stack.read())
    const read = await host.state.read.read()
    const before = bandItemsOf(sources, items, stack, read, from)
    const after = bandItemsOf(sources, items, stack, read, to)

    await host.state.band.update(band => bandResized(band, before, after, to))
  } catch (error) {
    host.debug(`herald: band: could not resize: ${messageOf(error)}`)
  }
}
