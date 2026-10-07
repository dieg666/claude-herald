import type { Host } from '../../host/host.js'
import { joinPath } from './join-path.js'
import { MAX_READ_BYTES } from './max-read-bytes.js'

/**
 * Reads files into the text map, each once; a file over 4 MiB or one that cannot be read is skipped with a debug line.
 *
 * @param host the engine
 * @param root the project root, absolute
 * @param sizes each file's size by path relative to the root
 * @param texts the texts read so far, added to
 * @param debug one line in the debug log
 */
export async function readFiles(
  host: Host,
  root: string,
  sizes: ReadonlyMap<string, number>,
  texts: Map<string, string>,
  debug: (text: string) => void,
): Promise<void> {
  for (const [path, size] of sizes) {
    if (texts.has(path)) {
      continue
    }

    if (size > MAX_READ_BYTES) {
      debug(`skipped ${path}: larger than 4 MiB`)
      continue
    }

    try {
      texts.set(path, await host.readText(joinPath(root, path)))
    } catch (error) {
      debug(`skipped ${path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
