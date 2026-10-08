import type { Source } from '../../types/index.js'
import { FACTORY_SOURCE_LABELS } from '../defaults/factory-source-labels.js'
import { FACTORY_SOURCES } from '../defaults/factory-sources.js'

/**
 * The name a band row shows for its source: a factory source's short label while it keeps its factory name, else the source's own name.
 *
 * @param source the source, undefined when gone
 */
export function sourceLabelOf(source: Pick<Source, 'id' | 'name'> | undefined): string {
  if (source === undefined) {
    return ''
  }

  const label = FACTORY_SOURCE_LABELS[source.id]
  const factory = FACTORY_SOURCES.find(entry => entry.id === source.id)

  return label !== undefined && factory?.name === source.name ? label : source.name
}
