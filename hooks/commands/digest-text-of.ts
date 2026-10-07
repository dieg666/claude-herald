import type { ItemsBySource, Source } from '../../types/index.js'
import { COMMAND_NAME } from '../names/command-name.js'

/**
 * How many of each source's latest items the digest names.
 */
const PER_SOURCE = 3

/**
 * The latest items of every enabled source as text (name, then title and address per item), for where no pane is drawn.
 *
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 */
export function digestTextOf(sources: readonly Source[], items: Readonly<ItemsBySource>): string {
  const enabled = sources.filter(source => source.isEnabled)

  if (enabled.length === 0) {
    return `Every source is off. /${COMMAND_NAME} list shows them; /${COMMAND_NAME} enable <name> turns one on.`
  }

  const blocks = enabled.map(source => {
    const latest = (items[source.id] ?? []).slice(0, PER_SOURCE)

    return [
      source.name,
      ...(latest.length === 0
        ? ['  nothing yet']
        : latest.map(item => `  ${item.title} · ${item.url}`)),
    ].join('\n')
  })

  return blocks.join('\n\n')
}
