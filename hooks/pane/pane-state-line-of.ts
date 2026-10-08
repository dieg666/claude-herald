import type { Item } from '../../types/index.js'
import { ACTION_HOTKEYS } from '../names/action-hotkeys.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import { agoOf } from './ago-of.js'
import type { PaneHealth } from './pane-health.js'
import type { PaneStack } from './pane-stack.js'
import type { PaneStateLine } from './pane-state-line.js'
import type { PaneTab } from './pane-tab.js'
import { shortReasonOf } from './short-reason-of.js'
import { stackStateLineOf } from './stack-state-line-of.js'

/**
 * The every-minutes sentence of an empty source tab, nothing without the interval.
 *
 * @param health what the refresh recorded
 */
function everyOf(health: PaneHealth): string {
  return health.refreshMinutes === undefined
    ? ''
    : ` Herald checks it every ${health.refreshMinutes} min.`
}

/**
 * The active tab's one dim state line, or undefined when it needs none: a source whose last refresh failed says why and, as the part kept whole, when it last worked, even with its items listed; an empty source tab says whether it is loading, has never loaded or its feed is empty; an empty saved tab says how to save; an empty stack tab says why it is empty.
 *
 * @param tab the active tab
 * @param list its items; on the stack tab, its rows' items
 * @param health what the refresh recorded
 * @param stack what the stack tab draws from, when there is one
 */
export function paneStateLineOf(
  tab: PaneTab,
  list: readonly Item[],
  health: PaneHealth,
  stack?: PaneStack,
): PaneStateLine | undefined {
  if (tab.id === SAVED_TAB) {
    return list.length === 0
      ? { text: `Nothing saved yet. Press ${ACTION_HOTKEYS.save} on an item to keep it here.` }
      : undefined
  }

  if (tab.id === STACK_TAB && stack !== undefined) {
    return list.length === 0 ? { text: stackStateLineOf(stack) } : undefined
  }

  const error = Object.hasOwn(health.errors, tab.id) ? health.errors[tab.id] : undefined
  const refreshedAt =
    health.refreshedAt !== undefined && Object.hasOwn(health.refreshedAt, tab.id)
      ? health.refreshedAt[tab.id]
      : undefined

  if (error !== undefined) {
    const text = `Couldn't refresh: ${shortReasonOf(error)}`

    return refreshedAt === undefined || health.now === undefined
      ? { text }
      : { text, tail: ` · last update ${agoOf(refreshedAt, health.now)}` }
  }

  if (list.length > 0) {
    return undefined
  }

  if (refreshedAt !== undefined) {
    return { text: `${tab.label} has no items right now.${everyOf(health)}` }
  }

  return {
    text:
      health.isRefreshing === true
        ? `Loading ${tab.label}…`
        : `Nothing from ${tab.label} yet.${everyOf(health)}`,
  }
}
