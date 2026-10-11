import type { Timer } from 'claude-code'

import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'

/**
 * The band's rotation timer, what runs when the page shown changes, and whether the band last drew compact, one per load of the module.
 */
export type Rotation = {
  /** The interval timer, once started. */
  timer: Timer | undefined
  /** Whether the band last drew compact, a page then holding one item; the band's render hook records it. */
  isCompact: boolean
  /** Called, not awaited, with the items of each page the band turns to, and a signal when a run hands them over. */
  readonly onPage: (host: Host, items: readonly Item[], signal?: AbortSignal) => Promise<unknown>
}
