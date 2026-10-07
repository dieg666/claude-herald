import type { EngineInterface, Register } from 'claude-code'
import { atom, read, update } from 'claude-code'

import Commands from './commands'
import Detect from './deps/detect'
import type { Host } from './host'
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

// Bounds the mod's model calls for summaries, at most two in flight; other model work may share it.
const MODEL_LIMITER = Summaries.limiterOf(Summaries.SUMMARY_LIMITS.concurrentRequests)

// The summary requests in flight and the queue ordering their writes, for this load of the module.
const SUMMARY_JOBS = Summaries.summaryJobsOf(MODEL_LIMITER)

// The refresh timer and the run in flight, for this load of the module; new items get one-line summaries.
const REFRESH = Refresh.refreshLoopOf((host, run, signal) =>
  Summaries.summarizeNew(host, SUMMARY_JOBS, run.newItems, signal),
)

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
    },
    userLanguage: async () => Store.userLanguageOf(await $.settings.read()),
    debug: text => $.ui.log(text, { to: 'debug' }),
    httpFetch: url => $.http.fetch(url),
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
      `news: could not register /news: ${error instanceof Error ? error.message : String(error)}`,
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
    detectSoon($)
    await registerNews($)

    return next(e)
  })

  on('command.run', { command: 'news' }, async ($, e) => {
    const reply = await Commands.runNews(hostOf($), e.args)

    if (reply.restartRefresh === true) {
      restartRefresh($)
    }

    return { text: reply.text }
  })

  // /clear, /resume and /branch reset $.state without a session.start.
  on('classic.SessionStart', { source: ['clear', 'resume', 'fork'] }, async ($, e, next) => {
    await State.hydrate(hostOf($)).catch(() => undefined)

    return next(e)
  }).catch(($, e, next) => next(e))
}
