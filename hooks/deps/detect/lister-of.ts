import type { Host } from '../../host/host.js'
import { joinPath } from './join-path.js'
import type { Lister } from './lister.js'

/**
 * A Lister over the Host for one detection: each directory listed once, at most `maxDirs` listings, failures logged.
 *
 * @param host the engine
 * @param root the project root, absolute
 * @param maxDirs how many directories may be listed
 * @param debug one line in the debug log
 */
export function listerOf(
  host: Host,
  root: string,
  maxDirs: number,
  debug: (text: string) => void,
): Lister {
  const listed = new Map<string, ReturnType<Lister>>()
  let left = maxDirs

  return dir => {
    const known = listed.get(dir)

    if (known !== undefined) {
      return known
    }

    if (left <= 0) {
      if (left === 0) {
        debug(`stopped listing after ${maxDirs} directories`)
        left -= 1
      }

      return Promise.resolve(undefined)
    }

    left -= 1

    const listing = host.listDir(joinPath(root, dir)).then(
      entries => [...entries].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)),
      (error: unknown) => {
        debug(
          `could not list ${dir || '.'}: ${error instanceof Error ? error.message : String(error)}`,
        )

        return undefined
      },
    )

    listed.set(dir, listing)

    return listing
  }
}
