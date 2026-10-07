import type { Host } from '../host/host.js'
import type { RefreshLoop } from './refresh-loop.js'
import type { RefreshRun } from './refresh-run.js'

/**
 * A stopped refresh loop.
 *
 * @param onRun called after each run that was not skipped, with the items new to it and the run's abort signal
 */
export function refreshLoopOf(
  onRun?: (host: Host, run: RefreshRun, signal: AbortSignal) => Promise<void> | void,
): RefreshLoop {
  return { timer: undefined, run: undefined, onRun }
}
