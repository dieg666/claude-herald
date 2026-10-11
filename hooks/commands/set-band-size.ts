import { resizeBand } from '../band/resize-band.js'
import { DEFAULT_SETTINGS } from '../defaults/default-settings.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { BAND_SIZE_BOUNDS } from '../store/band-size-bounds.js'
import { bandSizeOf } from '../store/band-size-of.js'
import { applySettings } from './apply-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { wholeNumberOf } from './whole-number-of.js'

/**
 * `/herald band size <n>`: saves how many items the full band shows at once (1 to 9), brings its page and selection inside pages of that size with the selected item kept, and asks for the items now shown to be summarized; anything else answers the usage and changes nothing.
 *
 * @param host the engine
 * @param rest what follows `band size`
 */
export async function setBandSize(host: Host, rest: string): Promise<CommandReply> {
  const { min, max } = BAND_SIZE_BOUNDS
  const usage = `/${COMMAND_NAME} band size <n> sets how many items the band shows at once, ${min} to ${max} (default ${DEFAULT_SETTINGS.bandSize})`
  const value = argumentOf(rest)

  if (value === '') {
    return { text: `${usage}; the number is missing.` }
  }

  const size = wholeNumberOf(value, min, max)

  if (size === undefined) {
    return { text: `${usage}; "${value}" is not a whole number from ${min} to ${max}.` }
  }

  const before = bandSizeOf((await host.state.settings.read()).bandSize)

  await applySettings(host, { bandSize: size })
  await resizeBand(host, before, size)

  return {
    text: `The band shows ${size} ${size === 1 ? 'item' : 'items'} at once, or one where the terminal is too narrow for the full band.`,
    resyncSummaries: true,
  }
}
