import type { EngineInterface, Register, UiPressArgument } from 'claude-code'
import { atom, read, update } from 'claude-code'

import type { Item } from '../types/index.js'
import Actions from './actions'
import Band from './band'
import Commands from './commands'
import Detect from './deps/detect'
import type { Host } from './host'
import Names from './names'
import Pane from './pane'
import Refresh from './refresh'
import State from './state'
import Store from './store'
import Summaries from './summaries'

const SOURCES = atom({ plugin: 'news', key: 'sources' } as const, State.INITIAL_STATE.sources)
const SETTINGS = atom({ plugin: 'news', key: 'settings' } as const, State.INITIAL_STATE.settings)
const ITEMS = atom({ plugin: 'news', key: 'items' } as const, State.INITIAL_STATE.items)
const SAVED = atom({ plugin: 'news', key: 'saved' } as const, State.INITIAL_STATE.saved)
const SUMMARIES = atom({ plugin: 'news', key: 'summaries' } as const, State.INITIAL_STATE.summaries)
const BAND = atom({ plugin: 'news', key: 'band' } as const, State.INITIAL_STATE.band)
const PANE = atom({ plugin: 'news', key: 'pane' } as const, State.INITIAL_STATE.pane)
const STATUS = atom({ plugin: 'news', key: 'status' } as const, State.INITIAL_STATE.status)
const STACK_STATE = atom({ plugin: 'news', key: 'stack' } as const, State.INITIAL_STATE.stack)

// Bounds the mod's model calls for summaries, at most two in flight; other model work may share it.
const MODEL_LIMITER = Summaries.limiterOf(Summaries.SUMMARY_LIMITS.concurrentRequests)

// The summary requests in flight and the queue ordering their writes, for this load of the module.
const SUMMARY_JOBS = Summaries.summaryJobsOf(MODEL_LIMITER)

// The band's rotation timer, for this load of the module; each page the band turns to gets one-line summaries.
const ROTATION = Band.rotationOf((host, items, signal) =>
  Summaries.ensureVisibleSummaries(host, SUMMARY_JOBS, items, signal),
)

// The refresh timer and the run in flight, for this load of the module; new items and the page the band shows get one-line summaries.
const REFRESH = Refresh.refreshLoopOf(async (host, run, signal) => {
  await Summaries.summarizeNew(host, SUMMARY_JOBS, run.newItems, signal)
  await Band.handShownPage(host, ROTATION, signal)
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
 * @param isOpening whether `/news` just opened the pane
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
 * One-line summaries for the items the pane shows after its tab or window changed.
 *
 * @param host the engine
 * @param items the items shown
 */
function summarizeShown(host: Host, items: readonly Item[]): Promise<unknown> {
  return Summaries.ensureVisibleSummaries(host, SUMMARY_JOBS, items)
}

/**
 * What the pane's Buttons run: tab and selection moves write the pane state and summarize what comes into view, mark-as-read drops the item drawn as selected from the saved list, the actions act on it.
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
    ...itemActionsOf($, item),
  }
}

/**
 * Detects the project's stack on the next clock tick, so the session start never waits for the walk.
 *
 * @param $ the hook's engine
 */
function detectSoon($: EngineInterface): void {
  try {
    $.clock.after(0, () => Detect.detectDeps(hostOf($)))
  } catch (error) {
    $.ui.log(
      `news: deps: could not schedule detection: ${error instanceof Error ? error.message : String(error)}`,
      { to: 'debug' },
    )
  }
}

/**
 * Declares `/news` for the session; a refused registration is logged to debug, never thrown.
 *
 * @param $ the hook's engine
 */
async function registerNews($: EngineInterface): Promise<void> {
  try {
    // The name stays literal: the static scan pairs it with the command.run hook.
    await $.command.register({
      name: 'news',
      description: Commands.NEWS_COMMAND.description,
      argumentHint: Commands.NEWS_COMMAND.argumentHint,
      immediate: true,
    })
  } catch (error) {
    $.ui.log(
      `news: could not register /${Names.COMMAND_NAME}: ${error instanceof Error ? error.message : String(error)}`,
      { to: 'debug' },
    )
  }
}

/**
 * Registers the news mod's hooks.
 *
 * @param on the engine's registrar
 */
export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await State.hydrate(hostOf($)).catch(() => undefined)
    restartRefresh($)
    restartRotation($)
    detectSoon($)
    await registerNews($)

    return next(e)
  })

  on('command.run', { command: 'news' }, async ($, e) => {
    const reply = await Commands.runNews(hostOf($), e.args)

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

    return { text: reply.text }
  })

  // The band reads state only; its Buttons write through the Host when pressed.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const sources = await read($, SOURCES)
    const items = Band.bandItemsOf(sources, await read($, ITEMS))

    if (items.length === 0) {
      return next(e)
    }

    const page = Band.bandPageOf(await read($, BAND), items)
    const { Box, Text, Button, Link } = $.ui.resolve(e)

    return Band.bandView(
      { Box, Text, Button, Link },
      Band.bandModelOf(
        page,
        sources,
        await read($, SUMMARIES),
        await read($, SAVED),
        e.props.bodyColumns,
      ),
      bandHandlersOf($, page.items[page.span.selected]),
      await next(e),
    )
  })

  // The pane reads state only (it notes the window size in a module holder); its Buttons write through the Host when pressed.
  // The id stays literal so validate reports it; a test mounts the pane by Names.PANE_ID to keep them equal.
  on('ui.render', { component: 'Pane', requestId: 'news' }, async ($, e) => {
    const sources = await read($, SOURCES)
    const saved = await read($, SAVED)
    const page = Pane.panePageOf(
      await read($, PANE),
      sources,
      await read($, ITEMS),
      saved,
      Pane.paneWindowSizeOf(sources, e.props.bodyColumns, e.props.scroll.bodyRows),
    )
    const { Box, Text, Button, Link } = $.ui.resolve(e)

    PANE_WINDOW.size = page.size

    return Pane.paneView(
      { Box, Text, Button, Link },
      Pane.paneModelOf(page, sources, await read($, SUMMARIES), saved, e.props.bodyColumns),
      paneHandlersOf($, page.items[page.selected], page.size),
    )
  })

  // /clear, /resume and /branch reset $.state without a session.start.
  on('classic.SessionStart', { source: ['clear', 'resume', 'fork'] }, async ($, e, next) => {
    await State.hydrate(hostOf($)).catch(() => undefined)
    await registerNews($)

    return next(e)
  }).catch(($, e, next) => next(e))
}
