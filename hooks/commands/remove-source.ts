import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { loadSources } from '../store/load-sources.js'
import { saveSources } from '../store/save-sources.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { dropSources } from './drop-sources.js'
import { findSource } from './find-source.js'

/**
 * `/news remove <name|url>`: removes a source and forgets its items, seen ids and page hash; saved items stay; asks for the items the band now shows to be summarized.
 *
 * @param host the engine
 * @param rest what follows `remove`
 */
export async function removeSource(host: Host, rest: string): Promise<CommandReply> {
  const sources = await loadSources(host)
  const found = findSource(sources, argumentOf(rest))

  if ('error' in found) {
    return { text: found.error }
  }

  const { source } = found
  const next = sources.filter(other => other.id !== source.id)

  await saveSources(host, next)
  await host.state.sources.update(() => next)
  await dropSources(host, [source.id])

  return {
    text: source.isFactory
      ? `Removed "${source.name}". /${COMMAND_NAME} reset brings the factory sources back.`
      : `Removed "${source.name}".`,
    resyncSummaries: true,
  }
}
