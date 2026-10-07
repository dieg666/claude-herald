import type { Source } from '../../types/index.js'
import { nameKeyOf } from './name-key-of.js'

/**
 * The name, or the name with ` (2)`, ` (3)`, ... when another source already has it, ignoring case.
 *
 * @param name the wanted name
 * @param sources every source
 */
export function uniqueNameOf(name: string, sources: readonly Source[]): string {
  const taken = new Set(sources.map(source => nameKeyOf(source.name)))
  let candidate = name

  for (let count = 2; taken.has(nameKeyOf(candidate)); count += 1) {
    candidate = `${name} (${count})`
  }

  return candidate
}
