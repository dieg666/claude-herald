import type { HttpResponse, ModelCompleteRequest, ModelCompleteResult, Timer } from 'claude-code'

import type { NewsState } from '../state/news-state.js'
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
  state: { [K in keyof NewsState]: StateCell<NewsState[K]> }

  /**
   * Claude Code's `language` setting (`$.settings.read`), `undefined` when unset.
   */
  userLanguage: () => Promise<string | undefined>

  /**
   * One line in the debug log only (`$.ui.log(text, { to: 'debug' })`).
   */
  debug: (text: string) => void

  /**
   * `$.http.fetch(url)`: the status and the body once read; rejects when the request fails.
   */
  httpFetch: (url: string) => Promise<Pick<HttpResponse, 'status' | 'ok' | 'text'>>

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
}
