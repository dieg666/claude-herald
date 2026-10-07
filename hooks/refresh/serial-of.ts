/**
 * A queue that runs each task after the one before it has settled, so concurrent read-then-write steps cannot interleave.
 */
export function serialOf(): <T>(task: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve()

  return task => {
    const run = tail.then(task)

    tail = run.catch(() => undefined)

    return run
  }
}
