import type { Source } from '../../types/index.js'
import { isRecord } from './is-record.js'
import { textOf } from './text-of.js'

/**
 * A stored value as a Source, its known fields only, or undefined when a required field is missing.
 *
 * @param value one stored source
 */
export function sourceOf(value: unknown): Source | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const id = textOf(value.id)
  const name = textOf(value.name)
  const url = textOf(value.url)
  const kind = value.kind === 'feed' || value.kind === 'page' ? value.kind : undefined

  if (id === undefined || name === undefined || url === undefined || kind === undefined) {
    return undefined
  }

  const fallbackUrl = textOf(value.fallbackUrl)

  return {
    id,
    name,
    url,
    kind,
    isEnabled: value.isEnabled !== false,
    ...(fallbackUrl === undefined ? {} : { fallbackUrl }),
    isFactory: value.isFactory === true,
  }
}
