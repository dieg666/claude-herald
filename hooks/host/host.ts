import type {
  FsEntry,
  HttpInit,
  HttpResponse,
  ModelCompleteRequest,
  ModelCompleteResult,
  PaneOpenArgs,
  ProcessRunInit,
  ProcessRunResult,
  RenderSurface,
  Timer,
  UiCopyResult,
  UiOpenResult,
} from 'claude-code'

import type { HeraldState } from '../state/herald-state.js'
import type { StateCell } from './state-cell.js'

/**
 * The engine as `register.tsx` binds it from `$`, each member spelled `$.noun.method(...)` there; what concern code calls instead of `$`.
 */
export type Host = {
  /**
   * `$.store.get`: the stored value, or `undefined` when the key was never set.
   */
  storeGet: (key: string) => Promise<unknown>

  /**
   * `$.store.set`.
   */
  storeSet: (key: string, value: unknown) => Promise<void>

  /**
   * Every `$.state` value of the mod, by key.
   */
  state: { [K in keyof HeraldState]: StateCell<HeraldState[K]> }

  /**
   * Claude Code's `language` setting (`$.settings.read`), `undefined` when unset.
   */
  userLanguage: () => Promise<string | undefined>

  /**
   * One line in the debug log only (`$.ui.log(text, { to: 'debug' })`).
   */
  debug: (text: string) => void

  /**
   * `$.http.fetch(url, init)`: the status and the body once read; rejects when the request fails. `init` carries request headers only.
   */
  httpFetch: (
    url: string,
    init?: Pick<HttpInit, 'headers'>,
  ) => Promise<Pick<HttpResponse, 'status' | 'ok' | 'text'>>

  /**
   * `$.model.complete(request, { signal })`.
   */
  modelComplete: (
    request: ModelCompleteRequest,
    signal?: AbortSignal,
  ) => Promise<ModelCompleteResult>

  /**
   * `$.ui.toast(text)`.
   */
  toast: (text: string) => void

  /**
   * `$.clock.now()`: milliseconds since the epoch.
   */
  clockNow: () => Promise<number>

  /**
   * `$.clock.every(ms, fn)`: calls `fn` every `ms` milliseconds until the timer is cancelled.
   */
  clockEvery: (ms: number, fn: () => void) => Timer

  /**
   * `$.clock.after(ms, fn)`: calls `fn` once after `ms` milliseconds unless the timer is cancelled first.
   */
  clockAfter: (ms: number, fn: () => void) => Timer

  /**
   * `$.session.root()`: the session's project root, absolute.
   */
  sessionRoot: () => Promise<string>

  /**
   * `$.env.get`: the user's home directory from `HOME`, else `USERPROFILE`; undefined when neither is set.
   */
  homeDir: () => Promise<string | undefined>

  /**
   * `$.fs.list`: a directory's entries, links not followed; rejects when it cannot be read.
   */
  listDir: (path: string) => Promise<readonly FsEntry[]>

  /**
   * `$.fs.read`: a file's text; rejects when missing or over 4 MiB.
   */
  readText: (path: string) => Promise<string>

  /**
   * `$.session.surfaces()`: the surfaces attached to the session now.
   */
  surfaces: () => Promise<readonly RenderSurface[]>

  /**
   * `$.ui.open(pane)`: opens or retitles a pane; says whether it is drawn.
   */
  openPane: (pane: PaneOpenArgs) => Promise<UiOpenResult>

  /**
   * `$.process.run(argv, init)`: runs a program with no shell; rejects when it cannot start or times out.
   */
  processRun: (argv: readonly string[], init?: ProcessRunInit) => Promise<ProcessRunResult>

  /**
   * `$.env.get('OS')`: `Windows_NT` on Windows, usually unset elsewhere.
   */
  osVariable: () => Promise<string | undefined>

  /**
   * `$.ui.copy({ text, surface })`: puts the text on that surface's clipboard; says whether it did.
   */
  copy: (text: string, surface: RenderSurface) => Promise<UiCopyResult>

  /**
   * One dim line in the transcript that Claude does not read (`$.ui.log(text)`).
   */
  log: (text: string) => void
}
