import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'

/**
 * What runs, not awaited, with the items the pane shows after its tab or window changed: their one-line summaries.
 */
export type PaneShown = (host: Host, items: readonly Item[]) => Promise<unknown>
