import type { Source } from '../../types/index.js'
import { sourceOf } from './source-of.js'

/**
 * The stored sources, dropping entries that are not one; undefined when the value is not a list.
 *
 * @param value what the store holds under `sources`
 */
export function sourcesOf(value: unknown): Source[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value.flatMap(entry => {
    const source = sourceOf(entry)

    return source === undefined ? [] : [source]
  })
}
