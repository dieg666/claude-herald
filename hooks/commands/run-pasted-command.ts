import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { heraldArgsOf } from './herald-args-of.js'
import type { PastedAnswer } from './pasted-answer.js'
import { runHeraldLine } from './run-herald-line.js'

/**
 * Runs one command of a paste of several: a subcommand runs as it would alone, while a bare `/herald` and another slash command only say why they did not run; never throws.
 *
 * @param host the engine
 * @param command one trimmed, non-blank command of the paste, its continuation lines included
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 * @param size how many items the pane's window may show
 */
export async function runPastedCommand(
  host: Host,
  command: string,
  stack: StackLoop,
  size: number,
): Promise<PastedAnswer> {
  const args = heraldArgsOf(command)

  if (args === undefined) {
    const [name = command] = command.split(/\s/, 1)

    return {
      heading: command,
      reply: { text: `${name} is not a /${COMMAND_NAME} command, so it did not run.` },
    }
  }

  if (args === '') {
    return {
      heading: `/${COMMAND_NAME}`,
      reply: {
        text: `/${COMMAND_NAME} alone opens the pane, which it does not do among several commands; run it on its own.`,
      },
    }
  }

  return {
    heading: `/${COMMAND_NAME} ${args}`,
    reply: await runHeraldLine(host, args, stack, size),
  }
}
