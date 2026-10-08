import { overrideTargetOf } from '../deps/resolve/override-target-of.js'
import { depFeedKeyOf } from '../deps/resolve/dep-feed-key-of.js'
import { setOverride } from '../deps/resolve/set-override.js'
import { mirrorStack } from '../deps/stack/mirror-stack.js'
import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { loadDepsProject } from '../store/load-deps-project.js'
import { loadStackProject } from '../store/load-stack-project.js'
import { saveStackProject } from '../store/save-stack-project.js'
import type { CommandReply } from './command-reply.js'
import { depKeyPartsOf } from './dep-key-parts-of.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'
import { projectPackageOf } from './project-package-of.js'
import { wordsOf } from './words-of.js'

/**
 * `/news deps map <package> <owner/repo|feed-url>`: sets where a package's releases are read (every project's, as overrides are kept by package), drops the releases this project kept from its old feed so the new one is read silently on the next refresh, and asks for that refresh while the package is followed.
 *
 * @param host the engine
 * @param rest what follows `map`
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 */
export async function mapDep(host: Host, rest: string, stack: StackLoop): Promise<CommandReply> {
  const words = wordsOf(rest)
  const [typed = '', target = ''] = words

  if (words.length !== 2 || words.some(word => word === '' || /\s/.test(word))) {
    return depsRefusalOf(
      'map',
      'Name the package, then where its releases are, each without spaces.',
    )
  }

  if (overrideTargetOf(target) === undefined) {
    return depsRefusalOf(
      'map',
      `"${target}" is neither a GitHub repository (owner/repo or its URL) nor a feed URL.`,
    )
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  const project = await loadDepsProject(host, at.root)
  const found = projectPackageOf(typed, [
    ...project.dependencies,
    ...(project.added ?? []),
    ...(project.ignored ?? []).map(depKeyPartsOf),
  ])

  if ('error' in found) {
    return depsRefusalOf('map', found.error)
  }

  const key = depFeedKeyOf(found.pkg)
  // In the stack's queue, so a refresh in flight writes its old feed's read before the drop, or skips it after.
  const override = await stack.serially(async () => {
    const set = await setOverride(host, found.pkg, target)

    if (set !== undefined && Object.hasOwn((await loadStackProject(host, at.root)).deps, key)) {
      await saveStackProject(host, at.root, stored => ({
        deps: Object.fromEntries(Object.entries(stored.deps).filter(([other]) => other !== key)),
      }))
      await mirrorStack(host, at.root)
    }

    return set
  })

  if (override === undefined) {
    return depsRefusalOf('map', `"${target}" is not a repository or a feed URL.`)
  }

  const where = override.repo ?? override.feed ?? target
  const isFollowed = project.dependencies.some(dependency => depFeedKeyOf(dependency) === key)

  if ((project.ignored ?? []).includes(key)) {
    return {
      text: `${key} now reads its releases from ${where}; it is ignored in ${at.root}, /${COMMAND_NAME} deps unignore ${key} follows it.`,
    }
  }

  return {
    text: `${key} now reads its releases from ${where}.${isFollowed ? '' : ` It is not followed in ${at.root}; /${COMMAND_NAME} deps add ${key} follows it.`}`,
    ...(isFollowed && project.settings.isEnabled ? { refreshStack: true } : {}),
  }
}
