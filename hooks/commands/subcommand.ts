import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import type { CommandReply } from './command-reply.js'

/**
 * One `/herald` subcommand: how it is typed, what it does, and how it runs.
 */
export type Subcommand = {
  /** How it is typed after `/herald`, e.g. `add <url> [name]`. */
  readonly usage: string
  /** What it does, one short line. */
  readonly summary: string
  /** Whether it refuses to run with nothing after its name. */
  readonly needsArgument: boolean
  /** Runs it with what follows its name, trimmed, and the stack loop whose queue orders the stack's store and state writes. */
  readonly run: (host: Host, rest: string, stack: StackLoop) => Promise<CommandReply>
}
