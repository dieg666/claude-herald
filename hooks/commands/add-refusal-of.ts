import type { Source } from '../../types/index.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { nameKeyOf } from './name-key-of.js'
import { sameUrlOf } from './same-url-of.js'

/**
 * Why a new source cannot be added (its address already followed, or the name it was given taken), or undefined.
 *
 * @param sources every source
 * @param url the new source's address
 * @param name the name the person gave it, if any
 */
export function addRefusalOf(
  sources: readonly Source[],
  url: string,
  name: string | undefined,
): string | undefined {
  const same = sameUrlOf(sources, url)

  if (same !== undefined) {
    return `${url} is already followed as "${same.name}".`
  }

  if (name !== undefined && sources.some(source => nameKeyOf(source.name) === nameKeyOf(name))) {
    return `A source is already named "${name}"; pick another name, or /${COMMAND_NAME} remove ${name} first.`
  }

  return undefined
}
