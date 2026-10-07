import type { Host } from '../host/host.js'
import type { CommandReply } from './command-reply.js'

/**
 * One `/news` subcommand: how it is typed, what it does, and how it runs.
 */
export type Subcommand = {
  /** How it is typed after `/news`, e.g. `add <url> [name]`. */
  readonly usage: string
  /** What it does, one short line. */
  readonly summary: string
  /** Whether it refuses to run with nothing after its name. */
  readonly needsArgument: boolean
  /** Runs it with what follows its name, trimmed. */
  readonly run: (host: Host, rest: string) => Promise<CommandReply>
}
