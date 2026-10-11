import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { PANE_FIRST_WINDOW } from '../pane/pane-first-window.js'
import type { CommandReply } from './command-reply.js'
import type { PastedAnswer } from './pasted-answer.js'
import { pastedCommandsOf } from './pasted-commands-of.js'
import { pastedReplyOf } from './pasted-reply-of.js'
import { runHeraldLine } from './run-herald-line.js'
import { runPastedCommand } from './run-pasted-command.js'

/**
 * Runs `/herald` with what was typed after it: one command runs as typed, several (a pasted block, a later line starting with `/`) run one after another, each awaited before the next and each answer under its command, stopping between commands once `signal` aborts; never throws.
 *
 * @param host the engine
 * @param args everything after `/herald`, line breaks kept
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 * @param size how many items the pane's window may show when `/herald` opens it
 * @param signal aborts the commands not yet run
 */
export async function runHerald(
  host: Host,
  args: string,
  stack: StackLoop,
  size: number = PANE_FIRST_WINDOW,
  signal?: AbortSignal,
): Promise<CommandReply> {
  const commands = pastedCommandsOf(args)

  if (commands.length <= 1) {
    return runHeraldLine(host, args, stack, size)
  }

  const answers: PastedAnswer[] = []

  for (const [index, command] of commands.entries()) {
    if (signal?.aborted === true) {
      return pastedReplyOf(answers, commands.slice(index))
    }

    answers.push(await runPastedCommand(host, command, stack, size))
  }

  return pastedReplyOf(answers)
}
