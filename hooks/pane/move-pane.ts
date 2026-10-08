import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { summaryTextOf } from '../summaries/summary-text-of.js'
import { handPaneItems } from './hand-pane-items.js'
import { paneAfter } from './pane-after.js'
import type { PaneMove } from './pane-move.js'
import { panePageOf } from './pane-page-of.js'
import { paneStackOf } from './pane-stack-of.js'
import type { PaneShown } from './pane-shown.js'
import { shownSelectedFirstOf } from './shown-selected-first-of.js'
import { viewTabs } from './view-tabs.js'

/**
 * The ids of a list of items, joined.
 *
 * @param items the items
 */
function idsOf(items: readonly Item[]): string {
  return JSON.stringify(items.map(item => item.id))
}

/**
 * Applies a move to the pane in state (nothing written when it changes nothing) and, when the tab or the items shown changed, hands the items shown to `onShown`, the selected one first; a tab switch records the tab left and the tab shown as viewed; a news or saved item with text selected inside the same window goes alone when it has no summary in state; never throws.
 *
 * @param host the engine
 * @param move what happened
 * @param size how many items the window may show
 * @param onShown what summarizes the items shown
 * @returns the items shown when the tab or the window changed, else undefined
 */
export async function movePane(
  host: Host,
  move: PaneMove,
  size: number,
  onShown: PaneShown,
): Promise<readonly Item[] | undefined> {
  try {
    const sources = await host.state.sources.read()
    const items = await host.state.items.read()
    const saved = await host.state.saved.read()
    const stack = paneStackOf(await host.state.stack.read())
    const health = await host.state.status.read()
    const stored = await host.state.pane.read()
    const before = panePageOf(stored, sources, items, saved, size, stack, {}, health)
    const wanted = paneAfter(before, move)

    if (wanted.tab === stored.tab && wanted.selected === stored.selected) {
      return undefined
    }

    const written = await host.state.pane.update(pane =>
      paneAfter(panePageOf(pane, sources, items, saved, size, stack, {}, health), move),
    )
    const after = panePageOf(written, sources, items, saved, size, stack, {}, health)

    if (after.tab.id === before.tab.id && idsOf(after.shown) === idsOf(before.shown)) {
      const selected = after.items[after.selected]

      if (
        after.stack === undefined &&
        selected !== undefined &&
        summaryTextOf(selected) !== '' &&
        !Object.hasOwn(await host.state.summaries.read(), selected.id)
      ) {
        handPaneItems(host, onShown, [selected])
      }

      return undefined
    }

    handPaneItems(host, onShown, shownSelectedFirstOf(after))

    if (after.tab.id !== before.tab.id) {
      await viewTabs(host, [before.tab.id, after.tab.id])
    }

    return after.shown
  } catch (error) {
    host.debug(`herald: pane: could not move: ${messageOf(error)}`)

    return undefined
  }
}
