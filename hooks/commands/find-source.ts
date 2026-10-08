import type { Source } from '../../types/index.js'
import { httpUrlOf } from './http-url-of.js'
import { nameKeyOf } from './name-key-of.js'
import { sameUrlOf } from './same-url-of.js'

/**
 * The one source a name (any case), id or address names, or why there is none.
 *
 * @param sources every source
 * @param query what the person typed
 */
export function findSource(
  sources: readonly Source[],
  query: string,
): { readonly source: Source } | { readonly error: string } {
  if (httpUrlOf(query) !== undefined) {
    const source = sameUrlOf(sources, query)

    return source === undefined ? { error: `No source reads ${query}.` } : { source }
  }

  const key = nameKeyOf(query)
  const byName = sources.filter(source => nameKeyOf(source.name) === key)
  const matches = byName.length > 0 ? byName : sources.filter(source => source.id === query)
  const [source] = matches

  if (source === undefined) {
    return { error: `No source is named "${query}". /herald list shows them.` }
  }

  return matches.length === 1
    ? { source }
    : { error: `${matches.length} sources are named "${query}"; name it by its address instead.` }
}
