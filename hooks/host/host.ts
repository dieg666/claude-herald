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
}
