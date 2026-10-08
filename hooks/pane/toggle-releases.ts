import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { handPaneItems } from './hand-pane-items.js'
import { panePageOf } from './pane-page-of.js'
import type { PaneShown } from './pane-shown.js'
import { paneStackOf } from './pane-stack-of.js'

/**
 * The ids of a list of items, joined.
 *
 * @param items the items
 */
function idsOf(items: readonly Item[]): string {
  return JSON.stringify(items.map(item => item.id))
}

/**
 * On the stack tab, lists the selected package's releases under it, or hides them when they are listed, in state; the selection then on the package's row. When the items shown changed, hands them to `onShown`, not waiting. Does nothing on another tab; never throws.
 *
 * @param host the engine
 * @param size how many items the window may show
 * @param onShown what checks the items shown
 * @returns the items shown when they changed, else undefined
 */
export async function toggleReleases(
  host: Host,
  size: number,
  onShown: PaneShown,
): Promise<readonly Item[] | undefined> {
  try {
    const sources = await host.state.sources.read()
    const items = await host.state.items.read()
    const saved = await host.state.saved.read()
    const pageOf = async (stack: ReturnType<typeof paneStackOf>) =>
      panePageOf(await host.state.pane.read(), sources, items, saved, size, stack)
    const before = await pageOf(paneStackOf(await host.state.stack.read()))
    const key = before.stack?.rows[before.selected]?.pkg.key

    if (key === undefined) {
      return undefined
    }

    const written = await host.state.stack.update(stack => {
      const expanded = stack.expanded ?? []

      return {
        ...stack,
        expanded: expanded.includes(key)
          ? expanded.filter(entry => entry !== key)
          : [...expanded, key],
      }
    })
    const stack = paneStackOf(written)

    await host.state.pane.update(pane => {
      const rows = panePageOf(pane, sources, items, saved, size, stack).stack?.rows ?? []
      const index = rows.findIndex(row => row.kind === 'package' && row.pkg.key === key)

      return index === -1 ? pane : { ...pane, selected: index }
    })

    const after = await pageOf(stack)

    if (idsOf(after.shown) === idsOf(before.shown)) {
      return undefined
    }

    handPaneItems(host, onShown, after.shown)

    return after.shown
  } catch (error) {
    host.debug(`herald: pane: could not toggle the releases: ${messageOf(error)}`)

    return undefined
  }
}
