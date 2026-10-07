import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { messageOf } from '../refresh/message-of.js'
import type { CommandReply } from './command-reply.js'
import { showNews } from './show-news.js'
import { SUBCOMMANDS } from './subcommands.js'
import { usageTextOf } from './usage-text-of.js'
import { wordsOf } from './words-of.js'

/**
 * Runs `/news` with what was typed after it: no words opens the news, a known subcommand runs with the rest, anything else (or a subcommand missing its argument) answers the usage; never throws.
 *
 * @param host the engine
 * @param args everything after `/news`
 */
export async function runNews(host: Host, args: string): Promise<CommandReply> {
  const [, name = '', rest = ''] = /^\s*(\S*)\s*([\s\S]*?)\s*$/.exec(args) ?? []
  const key = name.toLowerCase()

  try {
    if (name === '') {
      return await showNews(host)
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

    return await subcommand.run(host, rest)
  } catch (error) {
    const reason = messageOf(error)
    const label = key === '' ? `/${COMMAND_NAME}` : `/${COMMAND_NAME} ${key}`

    host.debug(`news: ${label}: ${reason}`)

    return { text: `${label} failed: ${reason}` }
  }
}
