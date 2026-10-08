import type { StackRun } from './stack-run.js'

/**
 * What following the stack keeps for one load of the module: whether the start detection ran, the project last looked at, the refresh in flight, whether another was asked meanwhile, whether the next run detects again, when lookups, feeds and flag checks last failed, and the queue that orders the stack's store and state writes.
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
  /** Whether the next refresh run detects the stack again first, whatever the manifests' hashes say. */
  isDetectPending: boolean
  /** When each lookup (`lookup:<ecosystem>:<name>`), release feed (`feed:<url>`) or flag check (`flag:<release id>`) last failed, in milliseconds since the epoch. */
  readonly failedAt: Map<string, number>
  readonly serially: <T>(task: () => Promise<T>) => Promise<T>
}
