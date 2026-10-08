import type { Timer } from 'claude-code'

import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'

/**
 * The band's rotation timer and what runs when the page shown changes, one per load of the module.
 */
export type Rotation = {
  /** The interval timer, once started. */
  timer: Timer | undefined
  /** Called, not awaited, with the items of each page the band turns to. */
  readonly onPage: (host: Host, items: readonly Item[]) => Promise<unknown>
}
