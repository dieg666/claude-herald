import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import type { CommandReply } from './command-reply.js'
import { DEPS_SUBCOMMANDS } from './deps-subcommands.js'
import { depsUsageTextOf } from './deps-usage-text-of.js'
import { showDeps } from './show-deps.js'
import { wordsOf } from './words-of.js'

/**
 * `/herald deps` with what was typed after it: nothing lists the stack, `help` its subcommands, a known subcommand runs with the rest, anything else (or a subcommand missing its argument) answers why with the usage.
 *
 * @param host the engine
 * @param args everything after `/herald deps`
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 */
export async function runDeps(host: Host, args: string, stack: StackLoop): Promise<CommandReply> {
  const [, name = '', rest = ''] = /^\s*(\S*)\s*([\s\S]*?)\s*$/.exec(args) ?? []
  const key = name.toLowerCase()

  if (name === '') {
    return showDeps(host)
  }

  if (key === 'help') {
    return { text: depsUsageTextOf(DEPS_SUBCOMMANDS) }
  }

  const subcommand = Object.hasOwn(DEPS_SUBCOMMANDS, key)
    ? DEPS_SUBCOMMANDS[key as keyof typeof DEPS_SUBCOMMANDS]
    : undefined

  if (subcommand === undefined) {
    return {
      text: `/${COMMAND_NAME} deps has no "${name}" subcommand.\n\n${depsUsageTextOf(DEPS_SUBCOMMANDS)}`,
    }
  }

  if (subcommand.needsArgument && wordsOf(rest).every(word => word.trim() === '')) {
    return {
      text: `/${COMMAND_NAME} deps ${key}: the argument is missing.\nUsage: /${COMMAND_NAME} deps ${subcommand.usage}`,
    }
  }

  return subcommand.run(host, rest, stack)
}
