import type { ItemsBySource, Source } from '../../types/index.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { isPaneSource } from '../pane/is-pane-source.js'

/**
 * How many of each source's latest items the digest names.
 */
const PER_SOURCE = 3

/**
 * The latest items of every source in the pane (listed and not hidden from it) as text (name, then title and address per item), for where no pane is drawn.
 *
 * @param sources every source, in order
 * @param items the kept items by source id, newest first
 */
export function digestTextOf(sources: readonly Source[], items: Readonly<ItemsBySource>): string {
  const listed = sources.filter(isPaneSource)

  if (!sources.some(source => source.isEnabled)) {
    return `Every source is off. /${COMMAND_NAME} list shows them; /${COMMAND_NAME} enable <name> turns one on.`
  }

  if (listed.length === 0) {
    return `Every source is hidden from the pane, the /${COMMAND_NAME} window. /${COMMAND_NAME} list shows them; /${COMMAND_NAME} pane on <name> shows one.`
  }

  const blocks = listed.map(source => {
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
