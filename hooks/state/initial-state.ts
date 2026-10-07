import type { NewsState } from './news-state.js'
import { DEFAULT_SETTINGS } from '../defaults/default-settings.js'

/**
 * What each `$.state` value holds before the first hydrate, and again after `/clear`, `/resume` or `/branch`.
 */
export const INITIAL_STATE: Readonly<NewsState> = {
  sources: [],
  settings: { ...DEFAULT_SETTINGS },
  items: {},
  saved: [],
  summaries: {},
  band: { offset: 0, selected: 0, isPaused: false },
  pane: { tab: '', selected: 0 },
  status: { lastRefreshAt: null, isRefreshing: false, errors: {} },
}
