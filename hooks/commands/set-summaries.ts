import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { loadSettings } from '../store/load-settings.js'
import { applySettings } from './apply-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { mirrorSummaries } from './mirror-summaries.js'
import { onOffOf } from './on-off-of.js'

const ON_TEXT =
  'Automatic summaries are on: Haiku writes a one-line summary under the headlines the band and the pane show.'

const OFF_TEXT =
  'Automatic summaries are off: Herald asks Haiku for no summary on its own, and Summarize (s) still writes one when you press it.'

/**
 * `/herald summaries [on|off]`: with nothing after it, says whether one-line summaries are asked for on their own; `on` saves it, mirrors the cached summaries and asks for the items shown to be summarized; `off` saves it, and the band and the pane drop their summary lines.
 *
 * @param host the engine
 * @param rest what follows `summaries`
 */
export async function setSummaries(host: Host, rest: string): Promise<CommandReply> {
  const value = argumentOf(rest)

  if (value === '') {
    const { autoSummaries } = await loadSettings(host)

    return {
      text: `${autoSummaries ? ON_TEXT : OFF_TEXT} /${COMMAND_NAME} summaries ${autoSummaries ? 'off' : 'on'} changes it.`,
    }
  }

  const autoSummaries = onOffOf(value)

  if (autoSummaries === undefined) {
    return {
      text: `Automatic summaries are on or off, e.g. /${COMMAND_NAME} summaries on; "${value}" is neither.`,
    }
  }

  const settings = await applySettings(host, { autoSummaries })

  if (!autoSummaries) {
    return { text: OFF_TEXT }
  }

  await mirrorSummaries(host, settings)

  return { text: ON_TEXT, resyncSummaries: true }
}
