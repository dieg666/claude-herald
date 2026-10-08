import { projectRootOf } from '../deps/detect/project-root-of.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import type { CommandReply } from './command-reply.js'

/**
 * The project a `/news deps` subcommand acts on, as detection finds it (the git root at or above the session's root, else that root alone, `isRepo` false), or the reply when the session runs at a filesystem root.
 *
 * @param host the engine
 */
export async function depsRootOf(
  host: Host,
): Promise<{ readonly root: string; readonly isRepo: boolean } | { readonly reply: CommandReply }> {
  const found = await projectRootOf(host)

  return found === undefined
    ? {
        reply: {
          text: `The session runs at a filesystem root, so /${COMMAND_NAME} deps has no project to follow.`,
        },
      }
    : { root: found.path, isRepo: found.maxDepth > 0 }
}
