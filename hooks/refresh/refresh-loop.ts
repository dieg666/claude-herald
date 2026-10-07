import type { Timer } from 'claude-code'

import type { Host } from '../host/host.js'
import type { RefreshRun } from './refresh-run.js'

/**
 * The refresh timer and the run in flight, one per load of the module.
 */
export type RefreshLoop = {
  /** The interval timer, once started. */
  timer: Timer | undefined
  /** Aborts the model calls of the run in flight; undefined between runs. */
  run: AbortController | undefined
  /** Called after each run that was not skipped, with the items new to it and the run's abort signal. */
  readonly onRun:
    ((host: Host, run: RefreshRun, signal: AbortSignal) => Promise<void> | void) | undefined
}
