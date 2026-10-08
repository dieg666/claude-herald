import type { Dependency, DepsProject } from '../../types/index.js'
import { clearOverride } from '../deps/resolve/clear-override.js'
import { depFeedKeyOf } from '../deps/resolve/dep-feed-key-of.js'
import { mirrorStack } from '../deps/stack/mirror-stack.js'
import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { loadStackProject } from '../store/load-stack-project.js'
import { saveStackProject } from '../store/save-stack-project.js'
import type { CommandReply } from './command-reply.js'
import { depsRefusalOf } from './deps-refusal-of.js'

/**
 * `/news deps map <package> off`: drops a package's mapping (every project's, as overrides are kept by package), drops the releases this project kept from the mapped feed so the registry's feed is read silently on the next refresh, and asks for that refresh while the package is followed; refused when the package has no mapping.
 *
 * @param host the engine
 * @param root the project root
 * @param project the project's stored record
 * @param pkg the package
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 */
export async function unmapDep(
  host: Host,
  root: string,
  project: DepsProject,
  pkg: Pick<Dependency, 'ecosystem' | 'name'>,
  stack: StackLoop,
): Promise<CommandReply> {
  const key = depFeedKeyOf(pkg)
  // In the stack's queue, like a map: a refresh in flight writes its read before the drop, or skips it after.
  const wasMapped = await stack.serially(async () => {
    const cleared = await clearOverride(host, pkg)

    if (cleared && Object.hasOwn((await loadStackProject(host, root)).deps, key)) {
      await saveStackProject(host, root, stored => ({
        deps: Object.fromEntries(Object.entries(stored.deps).filter(([other]) => other !== key)),
      }))
      await mirrorStack(host, root)
    }

    return cleared
  })

  if (!wasMapped) {
    return depsRefusalOf(
      'map',
      `${key} has no mapping to undo; it reads its releases from its registry.`,
    )
  }

  const isFollowed = project.dependencies.some(dependency => depFeedKeyOf(dependency) === key)

  if ((project.ignored ?? []).includes(key)) {
    return {
      text: `${key} reads its releases from its registry again; it is ignored in ${root}, /${COMMAND_NAME} deps unignore ${key} follows it.`,
    }
  }

  return {
    text: `${key} reads its releases from its registry again.${isFollowed ? '' : ` It is not followed in ${root}; /${COMMAND_NAME} deps add ${key} follows it.`}`,
    ...(isFollowed && project.settings.isEnabled ? { refreshStack: true } : {}),
  }
}
