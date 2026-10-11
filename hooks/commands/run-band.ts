import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { BAND_SIZE_BOUNDS } from '../store/band-size-bounds.js'
import type { CommandReply } from './command-reply.js'
import { onOffOf } from './on-off-of.js'
import { setBandSize } from './set-band-size.js'
import { setSurface } from './set-surface.js'

/**
 * `/herald band`: `size <n>` sets how many items the band shows at once, `on|off <name>` shows or hides a source on it; any other word answers both forms.
 *
 * @param host the engine
 * @param rest what follows `band`
 */
export async function runBand(host: Host, rest: string): Promise<CommandReply> {
  const [, word = '', after = ''] = /^\s*(\S*)\s*([\s\S]*?)\s*$/.exec(rest) ?? []

  if (word.toLowerCase() === 'size') {
    return setBandSize(host, after)
  }

  if (onOffOf(word) === undefined) {
    return {
      text: `/${COMMAND_NAME} band on|off <name> shows or hides a source in the band, the rotating lines above the prompt; /${COMMAND_NAME} band size <n> sets how many items it shows at once, ${BAND_SIZE_BOUNDS.min} to ${BAND_SIZE_BOUNDS.max}; "${word}" is neither on, off nor size.`,
    }
  }

  return setSurface(host, rest, 'band')
}
