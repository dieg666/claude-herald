import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { DEPS_CAP_BOUNDS } from '../store/deps-cap-bounds.js'
import { applyDepsSettings } from './apply-deps-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'
import { wholeNumberOf } from './whole-number-of.js'

/**
 * `/news deps cap <n>`: how many of this project's dependencies are followed at most (1 to 500, runtime and root-declared ones first); asks for the stack to be detected again while it is on.
 *
 * @param host the engine
 * @param rest what follows `cap`
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 */
export async function setDepsCap(
  host: Host,
  rest: string,
  stack: StackLoop,
): Promise<CommandReply> {
  const value = argumentOf(rest)
  const cap = wholeNumberOf(value, DEPS_CAP_BOUNDS.min, DEPS_CAP_BOUNDS.max)

  if (cap === undefined) {
    return depsRefusalOf(
      'cap',
      `The cap is a whole number from ${DEPS_CAP_BOUNDS.min} to ${DEPS_CAP_BOUNDS.max}; "${value}" is not one.`,
    )
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  const settings = await applyDepsSettings(host, stack, at.root, { cap })
  const text = `${at.root} follows at most ${cap} ${cap === 1 ? 'dependency' : 'dependencies'}.`

  return settings.isEnabled
    ? { text: `${text} Detecting its stack again.`, rescanStack: true }
    : { text }
}
