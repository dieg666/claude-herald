import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { applySettings } from './apply-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { wholeNumberOf } from './whole-number-of.js'

/**
 * `/news rotate <sec>`: saves the seconds between band rotations (5 to 3600).
 *
 * @param host the engine
 * @param rest what follows `rotate`
 */
export async function setRotate(host: Host, rest: string): Promise<CommandReply> {
  const value = argumentOf(rest)
  const seconds = wholeNumberOf(value, 5, 3600)

  if (seconds === undefined) {
    return {
      text: `The rotation is whole seconds from 5 to 3600, e.g. /${COMMAND_NAME} rotate 30; "${value}" is not one.`,
    }
  }

  await applySettings(host, { rotateSeconds: seconds })

  return { text: `The band turns its page every ${seconds} seconds.` }
}
