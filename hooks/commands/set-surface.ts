import type { Source } from '../../types/index.js'
import { isBandSource } from '../band/is-band-source.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { isPaneSource } from '../pane/is-pane-source.js'
import { loadSources } from '../store/load-sources.js'
import { saveSources } from '../store/save-sources.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { findSource } from './find-source.js'
import { onOffOf } from './on-off-of.js'

/** Where a source's items can show: the band above the prompt, or the `/herald` pane. */
type Surface = 'band' | 'pane'

/** How each surface is named in replies, so it is plain which is which. */
const SURFACE_TEXTS: Readonly<Record<Surface, { readonly name: string; readonly what: string }>> = {
  band: { name: 'the band', what: 'the rotating lines above the prompt' },
  pane: { name: 'the pane', what: `the /${COMMAND_NAME} window` },
}

/**
 * The source with one surface shown or hidden, a flag left out while shown so it reads as a source stored before the flags.
 *
 * @param source the source
 * @param surface the surface
 * @param isShown whether to show it there
 */
function withSurface(source: Source, surface: Surface, isShown: boolean): Source {
  const { isOnBand, isInPane, ...base } = source
  const onBand = surface === 'band' ? isShown : isOnBand !== false
  const inPane = surface === 'pane' ? isShown : isInPane !== false

  return {
    ...base,
    ...(onBand ? {} : { isOnBand: false }),
    ...(inPane ? {} : { isInPane: false }),
  }
}

/**
 * Where a source shows now, as the end of a reply: the other surface, neither, or nowhere while disabled.
 *
 * @param source the source after the change
 */
function whereOf(source: Source): string {
  if (!source.isEnabled) {
    return ` It is disabled, so it shows nowhere until /${COMMAND_NAME} enable ${source.name}.`
  }

  const onBand = isBandSource(source)
  const inPane = isPaneSource(source)

  if (onBand && inPane) {
    return ' It shows in both the band and the pane.'
  }

  if (onBand || inPane) {
    return ` It shows only in ${onBand ? 'the band' : 'the pane'}.`
  }

  return ` It shows nowhere now but is still fetched; /${COMMAND_NAME} disable ${source.name} stops that.`
}

/**
 * `/herald band on|off <name>` and `/herald pane on|off <name>`: shows or hides one source on the band (the rotating lines above the prompt) or in the pane (the `/herald` window), kept and fetched either way, and asks for the items now shown to be summarized.
 *
 * @param host the engine
 * @param rest what follows `band` or `pane`: `on` or `off`, then the source's name, id or address
 * @param surface which surface
 */
export async function setSurface(
  host: Host,
  rest: string,
  surface: Surface,
): Promise<CommandReply> {
  const { name, what } = SURFACE_TEXTS[surface]
  const usage = `/${COMMAND_NAME} ${surface} on|off <name> shows or hides a source in ${name}, ${what}`
  const [, word = '', query = ''] = /^\s*(\S*)\s*([\s\S]*?)\s*$/.exec(rest) ?? []
  const isShown = onOffOf(word)

  if (isShown === undefined) {
    return { text: `${usage}; "${word}" is neither on nor off.` }
  }

  if (argumentOf(query) === '') {
    return { text: `${usage}; the source's name is missing.` }
  }

  const sources = await loadSources(host)
  const found = findSource(sources, argumentOf(query))

  if ('error' in found) {
    return { text: found.error }
  }

  const before = surface === 'band' ? found.source.isOnBand : found.source.isInPane
  const label = `"${found.source.name}"`

  if ((before !== false) === isShown) {
    return {
      text: `${label} is already ${isShown ? 'shown in' : 'hidden from'} ${name}, ${what}.`,
    }
  }

  const source = withSurface(found.source, surface, isShown)
  const next = sources.map(other => (other.id === source.id ? source : other))

  await saveSources(host, next)
  await host.state.sources.update(() => next)

  return {
    text: `${label} is now ${isShown ? 'shown in' : 'hidden from'} ${name}, ${what}.${whereOf(source)}`,
    resyncSummaries: true,
  }
}
