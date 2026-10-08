import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { loadDepsProject } from '../store/load-deps-project.js'
import { applyDepsSettings } from './apply-deps-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'

/**
 * `/news deps on|off`: follows this project's dependency releases or stops (no request for them and no stack item shown while off, other sources untouched); turning it on asks for the stack to be detected again.
 *
 * @param host the engine
 * @param rest what follows `on` or `off`, which must be nothing
 * @param isEnabled the state to set
 */
export async function setDepsEnabled(
  host: Host,
  rest: string,
  isEnabled: boolean,
): Promise<CommandReply> {
  const name = isEnabled ? 'on' : 'off'

  if (argumentOf(rest) !== '') {
    return depsRefusalOf(name, `/${COMMAND_NAME} deps ${name} takes nothing after it.`)
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  const { settings } = await loadDepsProject(host, at.root)

  if (settings.isEnabled === isEnabled) {
    return { text: `Your stack is already ${name} for ${at.root}.` }
  }

  await applyDepsSettings(host, at.root, { isEnabled })

  return isEnabled
    ? {
        text: `Following the dependency releases of ${at.root} again; detecting its stack now.`,
        rescanStack: true,
      }
    : {
        text: `Stopped following the dependency releases of ${at.root}; its stack items are hidden and nothing is fetched for them. Other sources are untouched.`,
      }
}
