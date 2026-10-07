import type { Source } from '../../types/index.js'
import { urlKeyOf } from './url-key-of.js'

/**
 * The source already reading an address, as its main or fallback address, or undefined.
 *
 * @param sources every source
 * @param url the address
 */
export function sameUrlOf(sources: readonly Source[], url: string): Source | undefined {
  const key = urlKeyOf(url)

  return sources.find(
    source =>
      urlKeyOf(source.url) === key ||
      (source.fallbackUrl !== undefined && urlKeyOf(source.fallbackUrl) === key),
  )
}
