import type { Host } from '../../host/host.js'

/**
 * Waits on the engine's clock; resolves false at once, the timer cancelled, when the signal aborts.
 *
 * @param host the engine
 * @param ms how long
 * @param signal ends the wait early
 * @returns whether the whole wait passed
 */
export function waitFor(host: Host, ms: number, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted === true) {
    return Promise.resolve(false)
  }

  return new Promise(resolve => {
    const onAbort = () => {
      timer.cancel()
      resolve(false)
    }
    const timer = host.clockAfter(ms, () => {
      signal?.removeEventListener('abort', onAbort)
      resolve(true)
    })

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
