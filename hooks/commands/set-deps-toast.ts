import { DEPS_TOAST_LEVELS } from '../defaults/deps-toast-levels.js'
import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { applyDepsSettings } from './apply-deps-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { depsLevelOf } from './deps-level-of.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'

/**
 * `/herald deps toast <level|off>`: which new dependency releases of this project raise a toast, or none.
 *
 * @param host the engine
 * @param rest what follows `toast`
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 */
export async function setDepsToast(
  host: Host,
  rest: string,
  stack: StackLoop,
): Promise<CommandReply> {
  const value = argumentOf(rest)
  const toastLevel = depsLevelOf(value, DEPS_TOAST_LEVELS)

  if (toastLevel === undefined) {
    return depsRefusalOf(
      'toast',
      `The toast level is ${DEPS_TOAST_LEVELS.join(', ')}; "${value}" is none of them.`,
    )
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  await applyDepsSettings(host, stack, at.root, { toastLevel })

  return {
    text:
      toastLevel === 'off'
        ? `No toast for new dependency releases of ${at.root}.`
        : `New ${toastLevel} dependency releases of ${at.root} raise a toast.`,
  }
}
