import type { Limiter } from './limiter.js'

/**
 * Takes a slot, waiting in line while every slot is busy.
 *
 * @param limiter the limiter
 */
async function acquire(limiter: Limiter): Promise<void> {
  if (limiter.active < limiter.max) {
    limiter.active += 1

    return
  }

  // The task that ends hands its slot over, so `active` stays as it is.
  await new Promise<void>(resolve => limiter.waiting.push(resolve))
}

/**
 * Hands the slot to the oldest waiting task, or frees it.
 *
 * @param limiter the limiter
 */
function release(limiter: Limiter): void {
  const next = limiter.waiting.shift()

  if (next === undefined) {
    limiter.active -= 1
  } else {
    next()
  }
}

/**
 * Runs a task once a slot is free; a call with the key of a task still queued or running gets that task's result instead of starting another.
 *
 * @param limiter the limiter, shared by every caller that should count against the same bound
 * @param key what the task does, the same key meaning the same task and result type
 * @param task the work
 */
export function runLimited<T>(limiter: Limiter, key: string, task: () => Promise<T>): Promise<T> {
  const running = limiter.inFlight.get(key)

  if (running !== undefined) {
    return running as Promise<T>
  }

  const result = (async () => {
    await acquire(limiter)

    try {
      return await task()
    } finally {
      release(limiter)
      limiter.inFlight.delete(key)
    }
  })()

  limiter.inFlight.set(key, result)

  return result
}
