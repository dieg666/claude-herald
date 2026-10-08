import type { Item, Source } from '../../types/index.js'
import { sourceLabelOf } from '../defaults/source-label-of.js'
import { ALL_TAB } from '../names/all-tab.js'
import { ACTION_HOTKEYS } from '../names/action-hotkeys.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { SAVED_TAB } from '../names/saved-tab.js'
import { STACK_TAB } from '../names/stack-tab.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
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
 * The All tab's state line, or undefined when it needs none: the enabled sources whose last refresh failed, by name (one also says why), even with items listed; an empty tab says whether it is loading, every source is off, none has items now or none has loaded yet.
 *
 * @param list its items
 * @param health what the refresh recorded
 * @param sources every source, in order
 */
function allStateLineOf(
  list: readonly Item[],
  health: PaneHealth,
  sources: readonly Source[],
): PaneStateLine | undefined {
  const enabled = sources.filter(source => source.isEnabled)
  const failed = enabled.filter(source => Object.hasOwn(health.errors, source.id))
  const nameOf = (source: Source) => collapsedTextOf(sourceLabelOf(source)).trim() || source.id
  const [first] = failed

  if (first !== undefined) {
    return {
      text:
        failed.length === 1
          ? `Couldn't refresh ${nameOf(first)}: ${shortReasonOf(health.errors[first.id] ?? '')}`
          : `Couldn't refresh ${failed.length} sources: ${failed.map(nameOf).join(', ')}`,
    }
  }

  if (list.length > 0) {
    return undefined
  }

  if (enabled.length === 0) {
    return {
      text: `Every source is off. /${COMMAND_NAME} enable <name> turns one on.`,
    }
  }

  if (health.isRefreshing === true) {
    return { text: 'Loading the news…' }
  }

  const hasRefreshed = enabled.some(
    source => health.refreshedAt !== undefined && Object.hasOwn(health.refreshedAt, source.id),
  )

  const every =
    health.refreshMinutes === undefined
      ? ''
      : ` Herald checks the sources every ${health.refreshMinutes} min.`

  return {
    text: hasRefreshed
      ? `No source has items right now.${every}`
      : `Nothing from any source yet.${every}`,
  }
}

/**
 * The active tab's one dim state line, or undefined when it needs none: the All tab's as `allStateLineOf` says; a source whose last refresh failed says why and, as the part kept whole, when it last worked, even with its items listed; an empty source tab says whether it is loading, has never loaded or its feed is empty; an empty saved tab says how to save; an empty stack tab says why it is empty.
 *
 * @param tab the active tab
 * @param list its items; on the stack tab, its rows' items
 * @param health what the refresh recorded
 * @param stack what the stack tab draws from, when there is one
 * @param sources every source, in order, for the All tab
 */
export function paneStateLineOf(
  tab: PaneTab,
  list: readonly Item[],
  health: PaneHealth,
  stack?: PaneStack,
  sources: readonly Source[] = [],
): PaneStateLine | undefined {
  if (tab.id === ALL_TAB) {
    return allStateLineOf(list, health, sources)
  }

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
    return { text: `${tab.name} has no items right now.${everyOf(health)}` }
  }

  return {
    text:
      health.isRefreshing === true
        ? `Loading ${tab.name}…`
        : `Nothing from ${tab.name} yet.${everyOf(health)}`,
  }
}
