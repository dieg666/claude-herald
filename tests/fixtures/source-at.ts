import type { Source } from '../../types/index.js'

/**
 * An enabled user feed source with that id, its url `https://example.com/<id>.xml`, any field overridden.
 *
 * @param id the source id, also its name
 * @param fields the fields to override
 */
export function sourceAt(id: string, fields: Partial<Source> = {}): Source {
  return {
    id,
    name: id,
    url: `https://example.com/${id}.xml`,
    kind: 'feed',
    isEnabled: true,
    isFactory: false,
    ...fields,
  }
}
