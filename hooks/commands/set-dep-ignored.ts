import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { depFeedKeyOf } from '../deps/resolve/dep-feed-key-of.js'
import { mirrorStack } from '../deps/stack/mirror-stack.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { loadDepsProject } from '../store/load-deps-project.js'
import { updateDepsProject } from '../store/update-deps-project.js'
import type { CommandReply } from './command-reply.js'
import { depKeyPartsOf } from './dep-key-parts-of.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'
import { projectPackageOf } from './project-package-of.js'
import { singleWordOf } from './single-word-of.js'

/**
 * `/herald deps ignore|unignore <package>`: adds the package to this project's ignored list (dropped from the followed ones and from the band and pane at once) or takes it out; either way the stack is detected again while it is on, to fill or take the freed place. A bare name names a followed or added package (ignore) or an ignored one (unignore).
 *
 * @param host the engine
 * @param rest what follows `ignore` or `unignore`
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 * @param isIgnored the state to set
 */
export async function setDepIgnored(
  host: Host,
  rest: string,
  stack: StackLoop,
  isIgnored: boolean,
): Promise<CommandReply> {
  const name = isIgnored ? 'ignore' : 'unignore'
  const typed = singleWordOf(rest)

  if (typed === undefined) {
    return depsRefusalOf(name, 'Name one package, without spaces.')
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  const project = await loadDepsProject(host, at.root)
  const ignored = project.ignored ?? []
  const candidates = isIgnored
    ? [...project.dependencies, ...(project.added ?? [])]
    : ignored.map(depKeyPartsOf)
  const found = projectPackageOf(typed, candidates)

  if ('error' in found) {
    return depsRefusalOf(name, found.error)
  }

  const key = depFeedKeyOf(found.pkg)

  if (ignored.includes(key) === isIgnored) {
    return depsRefusalOf(name, `${key} is ${isIgnored ? 'already' : 'not'} ignored in ${at.root}.`)
  }

  if (isIgnored && !candidates.some(candidate => depFeedKeyOf(candidate) === key)) {
    return depsRefusalOf(
      name,
      `${key} is not followed or added in ${at.root}; /${COMMAND_NAME} deps lists the packages it follows.`,
    )
  }

  await stack.serially(async () => {
    await updateDepsProject(host, at.root, stored => ({
      ...stored,
      dependencies: isIgnored
        ? stored.dependencies.filter(dependency => depFeedKeyOf(dependency) !== key)
        : stored.dependencies,
      ignored: isIgnored
        ? [...(stored.ignored ?? []), key]
        : (stored.ignored ?? []).filter(other => other !== key),
    }))
    await mirrorStack(host, at.root)
  })

  const rescan = project.settings.isEnabled ? { rescanStack: true } : {}

  return isIgnored
    ? {
        text: `Ignoring ${key} in ${at.root}: it is no longer followed, looked up or shown.`,
        ...rescan,
      }
    : {
        text: `${key} is no longer ignored in ${at.root}; it is followed again when a manifest declares it or it was added.`,
        ...rescan,
      }
}
