import { COMMAND_NAME } from '../names/command-name.js'
import type { CommandReply } from './command-reply.js'
import { DEPS_USAGES } from './deps-usages.js'

/**
 * A refused `/news deps` subcommand's reply: why, then its usage line.
 *
 * @param name the subcommand
 * @param reason why it was refused, one sentence
 */
export function depsRefusalOf(name: keyof typeof DEPS_USAGES, reason: string): CommandReply {
  return { text: `${reason}\nUsage: /${COMMAND_NAME} deps ${DEPS_USAGES[name]}` }
}
