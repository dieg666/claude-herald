import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { PANE_FIRST_WINDOW } from '../pane/pane-first-window.js'
import { messageOf } from '../refresh/message-of.js'
import type { CommandReply } from './command-reply.js'
import { showHerald } from './show-herald.js'
import { SUBCOMMANDS } from './subcommands.js'
import { usageTextOf } from './usage-text-of.js'
import { wordsOf } from './words-of.js'

/**
 * Runs `/herald` with what was typed after it: no words opens the news, a known subcommand runs with the rest, anything else (or a subcommand missing its argument) answers the usage; never throws.
 *
 * @param host the engine
 * @param args everything after `/herald`
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 * @param size how many items the pane's window may show when `/herald` opens it
 */
export async function runHerald(
  host: Host,
  args: string,
  stack: StackLoop,
  size: number = PANE_FIRST_WINDOW,
): Promise<CommandReply> {
  const [, name = '', rest = ''] = /^\s*(\S*)\s*([\s\S]*?)\s*$/.exec(args) ?? []
  const key = name.toLowerCase()

  try {
    if (name === '') {
      return await showHerald(host, size)
    }

    if (key === 'help') {
      return { text: usageTextOf(SUBCOMMANDS) }
    }

    const subcommand = Object.hasOwn(SUBCOMMANDS, key) ? SUBCOMMANDS[key] : undefined

    if (subcommand === undefined) {
      return {
        text: `/${COMMAND_NAME} has no "${name}" subcommand.\n\n${usageTextOf(SUBCOMMANDS)}`,
      }
    }

    if (subcommand.needsArgument && wordsOf(rest).every(word => word.trim() === '')) {
      return {
        text: `/${COMMAND_NAME} ${subcommand.usage}: the argument is missing.\n\n${usageTextOf(SUBCOMMANDS)}`,
      }
    }

    return await subcommand.run(host, rest, stack)
  } catch (error) {
    const reason = messageOf(error)
    const label = key === '' ? `/${COMMAND_NAME}` : `/${COMMAND_NAME} ${key}`

    host.debug(`herald: ${label}: ${reason}`)

    return { text: `${label} failed: ${reason}` }
  }
}
