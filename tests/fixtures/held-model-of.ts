import type { ModelCompleteRequest, ModelCompleteResult } from 'claude-code'

import type { Host } from '../../hooks/host'

/**
 * Replaces a Host's model with one that holds every call until the test answers it, counting the calls in flight.
 *
 * @param host the Host whose `modelComplete` it replaces
 */
export function heldModelOf(host: Host) {
  const held: {
    request: ModelCompleteRequest
    signal?: AbortSignal
    answer: (reply: ModelCompleteResult) => void
  }[] = []
  let inFlight = 0
  let most = 0

  host.modelComplete = (request, signal) =>
    new Promise(resolve => {
      inFlight += 1
      most = Math.max(most, inFlight)
      held.push({
        request,
        ...(signal === undefined ? {} : { signal }),
        answer: reply => {
          inFlight -= 1
          resolve(reply)
        },
      })
    })

  // Lets pending promise chains run as far as they can.
  const settle = async () => {
    for (let tick = 0; tick < 50; tick += 1) {
      await Promise.resolve()
    }
  }

  return { held, settle, inFlight: () => inFlight, most: () => most }
}
