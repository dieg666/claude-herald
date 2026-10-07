/**
 * Bounds how many tasks run at once and shares a task already in flight under the same key; one per load of the module.
 */
export type Limiter = {
  /** The most tasks running at once. */
  readonly max: number
  /** Tasks running now. */
  active: number
  /** Starts of the tasks waiting for a slot, oldest first. */
  readonly waiting: (() => void)[]
  /** The result of each task queued or running, by key. */
  readonly inFlight: Map<string, Promise<unknown>>
}
