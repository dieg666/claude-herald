import type { Source } from '../../types/index.js'
import { SAVED_TAB } from '../names/saved-tab.js'

/**
 * A new source's id from its name: lowercase ASCII letters and digits joined by `-`, with `-2`, `-3`, ... when taken; never the saved tab's id.
 *
 * @param name the source's name
 * @param sources every source
 */
export function uniqueIdOf(name: string, sources: readonly Source[]): string {
  const slug =
    name
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      .replace(/-+$/, '') || 'source'

  const taken = new Set([SAVED_TAB, ...sources.map(source => source.id)])
  let candidate = slug

  for (let count = 2; taken.has(candidate); count += 1) {
    candidate = `${slug}-${count}`
  }

  return candidate
}
