import type { SummaryLang } from '../../types/index.js'

/**
 * A typed summary language: `feed`, `user`, or a language code such as `es` or `pt-BR` (its first part lowercased); undefined otherwise.
 *
 * @param text what the person typed
 */
export function langOf(text: string): SummaryLang | undefined {
  const lowered = text.toLowerCase()

  if (lowered === 'feed' || lowered === 'user') {
    return lowered
  }

  const match = /^([a-z]{2,3})(-[a-z0-9]{2,8})?$/i.exec(text)

  return match === null ? undefined : `${(match[1] ?? '').toLowerCase()}${match[2] ?? ''}`
}
