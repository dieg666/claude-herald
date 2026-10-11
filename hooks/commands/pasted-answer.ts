import type { CommandReply } from './command-reply.js'

/**
 * One command of a pasted `/herald` block and what it answered: the heading shown above the answer, and the answer.
 */
export type PastedAnswer = {
  /** The command the answer is for, `/herald <subcommand ...>`, or the command as pasted when it is not a `/herald` one. */
  readonly heading: string
  /** What the command answered. */
  readonly reply: CommandReply
}
