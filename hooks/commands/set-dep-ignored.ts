import type { Host } from '../host/host.js'
import { depFeedKeyOf } from '../deps/resolve/dep-feed-key-of.js'
import { mirrorStack } from '../deps/stack/mirror-stack.js'
import { loadDepsProject } from '../store/load-deps-project.js'
import { updateDepsProject } from '../store/update-deps-project.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { depKeyPartsOf } from './dep-key-parts-of.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'
import { projectPackageOf } from './project-package-of.js'

/**
 * `/news deps ignore|unignore <package>`: adds the package to this project's ignored list (dropped from the followed ones and from the band and pane at once) or takes it out; either way the stack is detected again while it is on, to fill or take the freed place. A bare name names a followed or added package (ignore) or an ignored one (unignore).
 *
 * @param host the engine
 * @param rest what follows `ignore` or `unignore`
 * @param isIgnored the state to set
 */
export async function setDepIgnored(
  host: Host,
  rest: string,
  isIgnored: boolean,
): Promise<CommandReply> {
  const name = isIgnored ? 'ignore' : 'unignore'
  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  const project = await loadDepsProject(host, at.root)
  const ignored = project.ignored ?? []
  const found = projectPackageOf(
    argumentOf(rest),
    isIgnored ? [...project.dependencies, ...(project.added ?? [])] : ignored.map(depKeyPartsOf),
  )

  if ('error' in found) {
    return depsRefusalOf(name, found.error)
  }

  const key = depFeedKeyOf(found.pkg)

  if (ignored.includes(key) === isIgnored) {
    return depsRefusalOf(name, `${key} is ${isIgnored ? 'already' : 'not'} ignored in ${at.root}.`)
  }

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
