import type { Timer } from 'claude-code'

import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'

/**
 * The band's rotation timer, what runs when the page shown changes, and the page size the band last drew with, one per load of the module.
 */
export type Rotation = {
  /** The interval timer, once started. */
  timer: Timer | undefined
  /** How many items a page holds: three, or one while the band is compact; the band's render hook records it. */
  pageSize: number
  /** Called, not awaited, with the items of each page the band turns to, and a signal when a run hands them over. */
  readonly onPage: (host: Host, items: readonly Item[], signal?: AbortSignal) => Promise<unknown>
}
