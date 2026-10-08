import { DEPS_LEVELS } from '../defaults/deps-levels.js'
import type { Host } from '../host/host.js'
import { applyDepsSettings } from './apply-deps-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { depsLevelOf } from './deps-level-of.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'

/**
 * `/news deps level <level>`: which of this project's dependency releases the band and the pane show; asks for what they show now to be checked.
 *
 * @param host the engine
 * @param rest what follows `level`
 */
export async function setDepsLevel(host: Host, rest: string): Promise<CommandReply> {
  const value = argumentOf(rest)
  const showLevel = depsLevelOf(value, DEPS_LEVELS)

  if (showLevel === undefined) {
    return depsRefusalOf(
      'level',
      `The level is ${DEPS_LEVELS.join(', ')}; "${value}" is none of them.`,
    )
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  await applyDepsSettings(host, at.root, { showLevel })

  return {
    text: `The band and the pane show the ${showLevel} dependency releases of ${at.root}.`,
    resyncSummaries: true,
  }
}
