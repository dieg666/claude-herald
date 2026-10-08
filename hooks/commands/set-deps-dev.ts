import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { loadDepsProject } from '../store/load-deps-project.js'
import { applyDepsSettings } from './apply-deps-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'
import { onOffOf } from './on-off-of.js'

/**
 * `/herald deps dev on|off`: whether this project's dev dependencies are followed too; asks for the stack to be detected again while it is on.
 *
 * @param host the engine
 * @param rest what follows `dev`
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 */
export async function setDepsDev(
  host: Host,
  rest: string,
  stack: StackLoop,
): Promise<CommandReply> {
  const value = argumentOf(rest)
  const includeDev = onOffOf(value)

  if (includeDev === undefined) {
    return depsRefusalOf(
      'dev',
      `Dev dependencies are followed (on) or not (off); "${value}" is neither.`,
    )
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  const before = await loadDepsProject(host, at.root)

  if (before.settings.includeDev === includeDev) {
    return {
      text: `Dev dependencies are already ${includeDev ? '' : 'not '}followed in ${at.root}.`,
    }
  }

  const settings = await applyDepsSettings(host, stack, at.root, { includeDev })
  const text = includeDev
    ? `Dev dependencies are followed in ${at.root} too.`
    : `Only runtime dependencies are followed in ${at.root}.`

  return settings.isEnabled
    ? { text: `${text} Detecting its stack again.`, rescanStack: true }
    : { text }
}
