import type { EngineInterface, Register, UiPressArgument } from 'claude-code'
import { atom, read, update } from 'claude-code'

import type { Item } from '../types/index.js'
import Actions from './actions'
import Band from './band'
import Commands from './commands'
import Stack from './deps/stack'
import type { Host } from './host'
import Names from './names'
import Pane from './pane'
import Refresh from './refresh'
import State from './state'
import Store from './store'
import Summaries from './summaries'

const SOURCES = atom({ plugin: 'herald', key: 'sources' } as const, State.INITIAL_STATE.sources)
const SETTINGS = atom({ plugin: 'herald', key: 'settings' } as const, State.INITIAL_STATE.settings)
const ITEMS = atom({ plugin: 'herald', key: 'items' } as const, State.INITIAL_STATE.items)
const SAVED = atom({ plugin: 'herald', key: 'saved' } as const, State.INITIAL_STATE.saved)
const SUMMARIES = atom(
  { plugin: 'herald', key: 'summaries' } as const,
  State.INITIAL_STATE.summaries,
)
const BAND = atom({ plugin: 'herald', key: 'band' } as const, State.INITIAL_STATE.band)
const PANE = atom({ plugin: 'herald', key: 'pane' } as const, State.INITIAL_STATE.pane)
const STATUS = atom({ plugin: 'herald', key: 'status' } as const, State.INITIAL_STATE.status)
const STACK_STATE = atom({ plugin: 'herald', key: 'stack' } as const, State.INITIAL_STATE.stack)
const READ = atom({ plugin: 'herald', key: 'read' } as const, State.INITIAL_STATE.read)
const VIEWED = atom({ plugin: 'herald', key: 'viewed' } as const, State.INITIAL_STATE.viewed)

// Bounds the mod's model calls for summaries, at most two in flight; other model work may share it.
const MODEL_LIMITER = Summaries.limiterOf(Summaries.SUMMARY_LIMITS.concurrentRequests)

// The summary requests in flight and the queue ordering their writes, for this load of the module.
const SUMMARY_JOBS = Summaries.summaryJobsOf(MODEL_LIMITER)

// Following the stack's releases for this load of the module: the start detection, the refresh in flight, recent failures.
const STACK = Stack.stackLoopOf()

/**
 * What the band and the pane run for the items they show: one-line summaries for news items while automatic summaries are on, the model's flag check for stack items.
 *
 * @param host the engine
 * @param items the items shown
 * @param signal aborts the model calls
 */
function showItems(host: Host, items: readonly Item[], signal?: AbortSignal): Promise<unknown> {
  return Promise.all([
    Summaries.ensureVisibleSummaries(
      host,
      SUMMARY_JOBS,
      items.filter(item => !Stack.isStackItem(item)),
      signal,
    ),
    Stack.flagShown(host, STACK, SUMMARY_JOBS, items, signal),
  ])
}

// The band's rotation timer, for this load of the module; each page the band turns to gets one-line summaries while they are on, its stack items the flag check.
const ROTATION = Band.rotationOf(showItems)

// The refresh timer and the run in flight, for this load of the module; new items and the page the band shows get one-line summaries while they are on, then the stack's releases are refreshed.
const REFRESH = Refresh.refreshLoopOf(async (host, run, signal) => {
  await Summaries.summarizeNew(host, SUMMARY_JOBS, run.newItems, signal)
  await Band.handShownPage(host, ROTATION, signal)
  await Stack.refreshStack(host, STACK, SUMMARY_JOBS, signal, { redetect: true })
})

// How many items the pane last drew, for this load of the module; the render hook records it, the summaries read it.
const PANE_WINDOW = Pane.paneWindowOf()

/**
 * Binds the Host from a hook's `$`, each engine call spelled in full.
 *
 * @param $ the hook's engine
 */
function hostOf($: EngineInterface): Host {
  return {
    storeGet: key => $.store.get(key),
    storeSet: (key, value) => $.store.set(key, value),
    state: {
      sources: { read: () => read($, SOURCES), update: change => update($, SOURCES, change) },
      settings: { read: () => read($, SETTINGS), update: change => update($, SETTINGS, change) },
      items: { read: () => read($, ITEMS), update: change => update($, ITEMS, change) },
      saved: { read: () => read($, SAVED), update: change => update($, SAVED, change) },
      summaries: {
        read: () => read($, SUMMARIES),
        update: change => update($, SUMMARIES, change),
      },
      band: { read: () => read($, BAND), update: change => update($, BAND, change) },
      pane: { read: () => read($, PANE), update: change => update($, PANE, change) },
      status: { read: () => read($, STATUS), update: change => update($, STATUS, change) },
      stack: {
        read: () => read($, STACK_STATE),
        update: change => update($, STACK_STATE, change),
      },
      read: { read: () => read($, READ), update: change => update($, READ, change) },
      viewed: { read: () => read($, VIEWED), update: change => update($, VIEWED, change) },
    },
    userLanguage: async () => Store.userLanguageOf(await $.settings.read()),
    debug: text => $.ui.log(text, { to: 'debug' }),
    httpFetch: (url, init) => $.http.fetch(url, init),
    modelComplete: (request, signal) => $.model.complete(request, { signal }),
    toast: text => $.ui.toast(text),
    clockNow: () => $.clock.now(),
    clockEvery: (ms, fn) => $.clock.every(ms, fn),
    clockAfter: (ms, fn) => $.clock.after(ms, fn),
    sessionRoot: () => $.session.root(),
    homeDir: async () => (await $.env.get('HOME')) ?? $.env.get('USERPROFILE'),
    listDir: path => $.fs.list(path),
    readText: path => $.fs.read(path),
    surfaces: () => $.session.surfaces(),
    openPane: pane => $.ui.open(pane),
    isPaneShown: () => isPaneShown($),
    processRun: (argv, init) => $.process.run(argv, init),
    osVariable: () => $.env.get('OS'),
    copy: (text, surface) => $.ui.copy({ text, surface }),
    log: text => $.ui.log(text),
  }
}

/**
 * Restarts the refresh timer at the stored interval, cancelling the one before, and kicks one refresh off, not awaited.
 *
 * @param $ the hook's engine
 */
function restartRefresh($: EngineInterface): void {
  void Refresh.restartRefresh(hostOf($), REFRESH)
}

/**
 * Restarts the band's rotation at the stored seconds, cancelling the timer before, and summarizes the page shown, not awaited.
 *
 * @param $ the hook's engine
 */
function restartRotation($: EngineInterface): void {
  void Band.restartRotation(hostOf($), ROTATION)
}

/**
 * Summarizes the items the band shows now in the current language, not awaited.
 *
 * @param $ the hook's engine
 */
function resyncSummaries($: EngineInterface): void {
  void Band.handShownPage(hostOf($), ROTATION)
}

/**
 * Summarizes the items the pane shows now in the current language, not awaited: in the window it last drew, else `PANE_FIRST_WINDOW` when it is opening, else nothing.
 *
 * @param $ the hook's engine
 * @param isOpening whether `/herald` just opened the pane
 */
function resyncPane($: EngineInterface, isOpening: boolean): void {
  const size = PANE_WINDOW.size ?? (isOpening ? Pane.PANE_FIRST_WINDOW : undefined)

  if (size !== undefined) {
    void Pane.handShownPane(hostOf($), size, summarizeShown)
  }
}

/**
 * What the per-item action Buttons run, on the item drawn as selected; the band and the pane share them.
 *
 * @param $ the render hook's engine, used only when a Button is pressed
 * @param item the selected item as drawn
 */
function itemActionsOf($: EngineInterface, item: Item | undefined): Actions.ItemActionHandlers {
  const act =
    (action: (host: Host, selected: Item, press: UiPressArgument) => Promise<boolean>) =>
    (press: UiPressArgument) =>
      void (item === undefined ? undefined : action(hostOf($), item, press))

  return {
    open: act((host, selected) => Actions.openItem(host, selected)),
    summarize: act((host, selected) => Actions.summarizeItem(host, SUMMARY_JOBS, selected)),
    save: act((host, selected) => Actions.saveItem(host, selected)),
    copy: act((host, selected, press) => Actions.copyItem(host, selected, press.surface)),
  }
}

/**
 * What the band's Buttons run: page and selection moves write the band state, the actions act on the item drawn as selected.
 *
 * @param $ the render hook's engine, used only when a Button is pressed
 * @param item the selected item as drawn
 */
function bandHandlersOf($: EngineInterface, item: Item | undefined): Band.BandHandlers {
  const turn = (move: Band.BandMove) => () => void Band.turnBand(hostOf($), ROTATION, move)

  return {
    prev: turn('prev'),
    next: turn('next'),
    auto: turn('auto'),
    up: turn('up'),
    down: turn('down'),
    ...itemActionsOf($, item),
  }
}

/**
 * One-line summaries (stack items: the flag check) for the items the pane shows after its tab, window or filter changed.
 *
 * @param host the engine
 * @param items the items shown
 */
function summarizeShown(host: Host, items: readonly Item[]): Promise<unknown> {
  return showItems(host, items)
}

/**
 * What the pane's Buttons run: tab and selection moves write the pane state and summarize what comes into view, mark-as-read drops the item drawn as selected from the saved list, the releases toggle lists or hides the selected package's releases, the actions act on the item drawn as selected; typing in the stack tab's filter writes the filter.
 *
 * @param $ the render hook's engine, used only when a Button is pressed
 * @param item the selected item as drawn
 * @param size how many items the pane's window shows
 */
function paneHandlersOf(
  $: EngineInterface,
  item: Item | undefined,
  size: number,
): Pane.PaneHandlers {
  const move = (to: Pane.PaneMove) => () => void Pane.movePane(hostOf($), to, size, summarizeShown)

  const markRead = async (host: Host, selected: Item) => {
    if (await Actions.markRead(host, selected)) {
      await Pane.handShownPane(host, size, summarizeShown)
    }
  }

  return {
    tab: id => move({ tab: id }),
    up: move('up'),
    down: move('down'),
    read: () => void (item === undefined ? undefined : markRead(hostOf($), item)),
    releases: () => void Pane.toggleReleases(hostOf($), size, summarizeShown),
    filter: value => void Pane.filterPane(hostOf($), value, size, summarizeShown),
    ...itemActionsOf($, item),
  }
}

/**
 * Starts the stack on the next clock tick (its kept releases into state, the detection, the first refresh), so the session start never waits for the walk.
 *
 * @param $ the hook's engine
 */
function detectSoon($: EngineInterface): void {
  try {
    $.clock.after(0, () => void Stack.startStack(hostOf($), STACK, SUMMARY_JOBS))
  } catch (error) {
    $.ui.log(
      `herald: deps: could not schedule detection: ${error instanceof Error ? error.message : String(error)}`,
      { to: 'debug' },
    )
  }
}

/**
 * Refreshes the stack's releases, detecting the stack again first when asked, not awaited; behind a refresh in flight it runs once after it.
 *
 * @param $ the hook's engine
 * @param isRescan whether to detect the stack again first
 */
function refreshStackSoon($: EngineInterface, isRescan: boolean): void {
  void (isRescan
    ? Stack.rescanStack(hostOf($), STACK, SUMMARY_JOBS)
    : Stack.refreshStack(hostOf($), STACK, SUMMARY_JOBS))
}

/**
 * Whether the Herald pane is open, drawn and the pane the surface shows, by the engine's record of this plugin's panes; false when the engine cannot say, so the band is drawn.
 *
 * @param $ the render hook's engine
 */
async function isPaneShown($: EngineInterface): Promise<boolean> {
  try {
    const panes = await $.ui.panes()

    return panes.some(pane => pane.id === Names.PANE_ID && pane.isShown && pane.isPlaced)
  } catch {
    return false
  }
}

/**
 * Declares `/herald` for the session; a refused registration is logged to debug, never thrown.
 *
 * @param $ the hook's engine
 */
async function registerHerald($: EngineInterface): Promise<void> {
  try {
    // The name stays literal: the static scan pairs it with the command.run hook.
    await $.command.register({
      name: 'herald',
      description: Commands.HERALD_COMMAND.description,
      argumentHint: Commands.HERALD_COMMAND.argumentHint,
      immediate: true,
    })
  } catch (error) {
    $.ui.log(
      `herald: could not register /${Names.COMMAND_NAME}: ${error instanceof Error ? error.message : String(error)}`,
      { to: 'debug' },
    )
  }
}

/**
 * Registers the Herald mod's hooks.
 *
 * @param on the engine's registrar
 */
export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await State.hydrate(hostOf($)).catch(() => undefined)
    restartRefresh($)
    restartRotation($)
    detectSoon($)
    await registerHerald($)

    return next(e)
  })

  on('command.run', { command: 'herald' }, async ($, e) => {
    const reply = await Commands.runHerald(hostOf($), e.args, STACK)

    if (reply.restartRefresh === true) {
      restartRefresh($)
    }

    if (reply.restartRotation === true) {
      restartRotation($)
    } else if (reply.resyncSummaries === true) {
      resyncSummaries($)
    }

    if (
      reply.summarizePane === true ||
      reply.restartRotation === true ||
      reply.resyncSummaries === true
    ) {
      resyncPane($, reply.summarizePane === true)
    }

    if (reply.rescanStack === true || reply.refreshStack === true) {
      refreshStackSoon($, reply.rescanStack === true)
    }

    return { text: reply.text }
  })

  // The band reads state and the clock only (it notes its page size in the rotation); its Buttons write through the Host when pressed.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await isPaneShown($))) {
      return next(e)
    }

    const sources = await read($, SOURCES)
    const items = Band.bandItemsOf(
      sources,
      await read($, ITEMS),
      Stack.shownStackItemsOf(await read($, STACK_STATE)),
      await read($, READ),
    )

    if (items.length === 0) {
      return next(e)
    }

    const columns = e.props.bodyColumns
    const now = await $.clock.now()

    ROTATION.pageSize = Band.bandPageSizeOf(columns, items.length)

    const page = Band.bandPageOf(await read($, BAND), items, ROTATION.pageSize)
    const { Box, Text, Button, Link } = $.ui.resolve(e)
    const handlers = bandHandlersOf($, page.items[page.span.selected])

    if (Band.isCompactBand(columns, items.length)) {
      return Band.compactBandView(
        { Box, Text, Button, Link },
        Band.compactBandModelOf(page, sources, columns, now),
        handlers,
        await next(e),
      )
    }

    return Band.bandView(
      { Box, Text, Button, Link },
      Band.bandModelOf(
        page,
        sources,
        await read($, SUMMARIES),
        await read($, SAVED),
        columns,
        (await read($, SETTINGS)).autoSummaries === true,
        now,
      ),
      handlers,
      await next(e),
    )
  })

  // Opening or closing the pane draws the band again, which yields while the pane shows; a failure never holds the pane.
  on('ui.open', { id: 'herald' }, async ($, e, next) => {
    const opened = await next(e)

    $.ui.invalidate('ui.render')

    return opened
  }).catch(($, e, next) => next(e))

  on('ui.close', { id: 'herald' }, async ($, e, next) => {
    const closed = await next(e)

    $.ui.invalidate('ui.render')
    // The page the band shows again gets its summaries now, not at the next turn.
    resyncSummaries($)

    return closed
  }).catch(($, e, next) => next(e))

  // The pane reads state and the clock only (it notes the window size in a module holder); its Buttons write through the Host when pressed.
  // The id stays literal so validate reports it; a test mounts the pane by Names.PANE_ID to keep them equal.
  on('ui.render', { component: 'Pane', requestId: 'herald' }, async ($, e) => {
    const sources = await read($, SOURCES)
    const items = await read($, ITEMS)
    const saved = await read($, SAVED)
    const stack = Pane.paneStackOf(await read($, STACK_STATE))
    const newCounts = Pane.paneNewCountsOf(items, await read($, VIEWED))
    const settings = await read($, SETTINGS)
    const health = {
      ...(await read($, STATUS)),
      refreshMinutes: settings.refreshMinutes,
      now: await $.clock.now(),
    }
    const page = Pane.panePageOf(
      await read($, PANE),
      sources,
      items,
      saved,
      Pane.paneWindowSizeOf(
        sources,
        e.props.bodyColumns,
        e.props.scroll.bodyRows,
        stack,
        saved,
        newCounts,
      ),
      stack,
      newCounts,
      health,
    )
    const table = $.ui.resolve(e)
    const { Box, Text, Button, Link } = table
    // Mobile and surfaces without Input get no filter field.
    const Input = e.surface === 'mobile' || !('Input' in table) ? undefined : table.Input

    PANE_WINDOW.size = page.size

    return Pane.paneView(
      { Box, Text, Button, Link, ...(Input === undefined ? {} : { Input }) },
      Pane.paneModelOf(
        page,
        sources,
        await read($, SUMMARIES),
        saved,
        e.props.bodyColumns,
        settings.autoSummaries === true,
        stack?.filter,
        // A phone taps the Buttons, so it never needs the focus chord.
        e.props.isFocused || e.surface === 'mobile',
        await read($, READ),
      ),
      paneHandlersOf($, page.items[page.selected], page.size),
      e.surface,
      Pane.paneFillRowsOf(e.props.placement, e.props.scroll.bodyRows),
    )
  })

  // /clear, /resume and /branch reset $.state without a session.start.
  on('classic.SessionStart', { source: ['clear', 'resume', 'fork'] }, async ($, e, next) => {
    await State.hydrate(hostOf($)).catch(() => undefined)
    await Stack.hydrateStack(hostOf($), STACK)
    await registerHerald($)

    return next(e)
  }).catch(($, e, next) => next(e))
}
