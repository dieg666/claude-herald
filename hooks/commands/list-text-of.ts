import type { ItemsBySource, Source } from '../../types/index.js'
import { COMMAND_NAME } from '../names/command-name.js'

/**
 * Every source as one line (on or off, shown on the band or not, shown in the pane or not, kind, item count, name, address), its last error on the line below, under a heading that says which surface is which.
 *
 * @param sources every source, in order
 * @param items the kept items by source id
 * @param errors the last failure by source id
 */
export function listTextOf(
  sources: readonly Source[],
  items: Readonly<ItemsBySource>,
  errors: Readonly<Record<string, string>>,
): string {
  if (sources.length === 0) {
    return `No sources. /${COMMAND_NAME} add <url> [name] follows a feed; /${COMMAND_NAME} reset restores the factory sources.`
  }

  const enabled = sources.filter(source => source.isEnabled).length

  const lines = sources.flatMap(source => {
    const count = items[source.id]?.length ?? 0
    const error = errors[source.id]

    const line = [
      source.isEnabled ? 'on ' : 'off',
      source.isOnBand === false ? 'band off' : 'band on ',
      source.isInPane === false ? 'pane off' : 'pane on ',
      source.kind.padEnd(4),
      `${String(count).padStart(2)} ${count === 1 ? 'item ' : 'items'}`,
      source.name,
      source.url,
    ].join('  ')

    return error === undefined ? [`  ${line}`] : [`  ${line}`, `       last error: ${error}`]
  })

  return [
    `${enabled} of ${sources.length} sources enabled; band = the rotating lines above the prompt, pane = the /${COMMAND_NAME} window:`,
    ...lines,
  ].join('\n')
}
