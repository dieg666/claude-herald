import type { Timer } from 'claude-code'

import type { Host } from '../host/host.js'
import { messageOf } from './message-of.js'

/**
 * The work's result, or what `late` gives when `ms` pass on the engine's clock first; the timer is cancelled once either settles.
 *
 * @param host the engine
 * @param ms how long the work may take
 * @param work the work under way
 * @param late the result in its place when it is late
 */
export async function withinDeadline<T>(
  host: Host,
  ms: number,
  work: Promise<T>,
  late: () => T,
): Promise<T> {
  let timer: Timer | undefined

  const deadline = new Promise<T>(resolve => {
    try {
      timer = host.clockAfter(ms, () => resolve(late()))
    } catch (error) {
      host.debug(`herald: no deadline: ${messageOf(error)}`)
    }
  })

  try {
    return await Promise.race([work, deadline])
  } finally {
    timer?.cancel()
  }
}
