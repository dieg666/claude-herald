import type { StackRun } from './stack-run.js'

/**
 * What following the stack keeps for one load of the module: whether the start detection ran, the project last looked at, the refresh in flight, whether another was asked meanwhile, when lookups and feeds last failed, and the queue that orders the stack's store and state writes.
 */
export type StackLoop = {
  /** Set once the session's start detection is done; refreshes before it do nothing. */
  isStarted: boolean
  /** The project root last looked at. */
  root: string | undefined
  /** The refresh in flight. */
  running: Promise<StackRun> | undefined
  /** Whether a refresh was asked while one ran, so one more runs after it. */
  isPending: boolean
  /** When each lookup (`lookup:<ecosystem>:<name>`) or release feed (`feed:<url>`) last failed, in milliseconds since the epoch. */
  readonly failedAt: Map<string, number>
  readonly serially: <T>(task: () => Promise<T>) => Promise<T>
}
