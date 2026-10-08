import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { loadDepsProject } from '../store/load-deps-project.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'

/**
 * `/herald deps rescan`: asks for the stack to be detected again now and its releases refreshed, off the command's dispatch; refused while the project's stack is off.
 *
 * @param host the engine
 * @param rest what follows `rescan`, which must be nothing
 */
export async function rescanDeps(host: Host, rest: string): Promise<CommandReply> {
  if (argumentOf(rest) !== '') {
    return depsRefusalOf('rescan', `/${COMMAND_NAME} deps rescan takes nothing after it.`)
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  const { settings } = await loadDepsProject(host, at.root)

  if (!settings.isEnabled) {
    return {
      text: `Your stack is off for ${at.root}, so there is nothing to rescan; /${COMMAND_NAME} deps on turns it on and detects it.`,
    }
  }

  return {
    text: `Detecting the stack of ${at.root} again; /${COMMAND_NAME} deps shows it once done.`,
    rescanStack: true,
  }
}
