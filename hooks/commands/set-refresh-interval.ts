import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { applySettings } from './apply-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { wholeNumberOf } from './whole-number-of.js'

/**
 * `/herald interval <min>`: saves the minutes between refreshes (1 to 1440) and asks for the refresh timer to restart.
 *
 * @param host the engine
 * @param rest what follows `interval`
 */
export async function setRefreshInterval(host: Host, rest: string): Promise<CommandReply> {
  const value = argumentOf(rest)
  const minutes = wholeNumberOf(value, 1, 1440)

  if (minutes === undefined) {
    return {
      text: `The interval is whole minutes from 1 to 1440, e.g. /${COMMAND_NAME} interval 10; "${value}" is not one.`,
    }
  }

  await applySettings(host, { refreshMinutes: minutes })

  return {
    text: `Refreshing every ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, starting now.`,
    restartRefresh: true,
  }
}
