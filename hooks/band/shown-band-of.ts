import type { Item } from '../../types/index.js'
import { shownStackItemsOf } from '../deps/stack/shown-stack-items-of.js'
import type { Host } from '../host/host.js'
import { bandSizeOf } from '../store/band-size-of.js'
import { bandItemsOf } from './band-items-of.js'
import type { Rotation } from './rotation.js'

/**
 * What the band pages through now, from state, and how many items its page holds: one while it last drew compact, else the full band's size in the settings.
 *
 * @param host the engine
 * @param rotation the rotation, which knows whether the band last drew compact
 */
export async function shownBandOf(
  host: Host,
  rotation: Rotation,
): Promise<{ readonly items: Item[]; readonly size: number }> {
  const bandSize = bandSizeOf((await host.state.settings.read()).bandSize)
  const items = bandItemsOf(
    await host.state.sources.read(),
    await host.state.items.read(),
    shownStackItemsOf(await host.state.stack.read()),
    await host.state.read.read(),
    bandSize,
  )

  return { items, size: rotation.isCompact ? 1 : bandSize }
}
