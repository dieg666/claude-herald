import type { Host } from '../host/host.js'
import { loadDepFeeds } from '../store/load-dep-feeds.js'
import { loadDepsProject } from '../store/load-deps-project.js'
import type { CommandReply } from './command-reply.js'
import { depsRootOf } from './deps-root-of.js'
import { depsTextOf } from './deps-text-of.js'

/**
 * `/news deps`: this project's stack as text, from the store alone (no request).
 *
 * @param host the engine
 */
export async function showDeps(host: Host): Promise<CommandReply> {
  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  return {
    text: depsTextOf(at, await loadDepsProject(host, at.root), await loadDepFeeds(host)),
  }
}
