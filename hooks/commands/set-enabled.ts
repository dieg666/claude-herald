import type { Host } from '../host/host.js'
import { refreshSource } from '../refresh/refresh-source.js'
import { loadSources } from '../store/load-sources.js'
import { saveSources } from '../store/save-sources.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { findSource } from './find-source.js'

/**
 * `/news enable|disable <name>`: turns a source on (refreshing it at once, not awaited) or off, keeping it either way.
 *
 * @param host the engine
 * @param rest what follows `enable` or `disable`
 * @param isEnabled the state to set
 */
export async function setEnabled(
  host: Host,
  rest: string,
  isEnabled: boolean,
): Promise<CommandReply> {
  const sources = await loadSources(host)
  const found = findSource(sources, argumentOf(rest))

  if ('error' in found) {
    return { text: found.error }
  }

  const source = { ...found.source, isEnabled }

  if (found.source.isEnabled === isEnabled) {
    return { text: `"${source.name}" is already ${isEnabled ? 'enabled' : 'disabled'}.` }
  }

  const next = sources.map(other => (other.id === source.id ? source : other))

  await saveSources(host, next)
  await host.state.sources.update(() => next)

  if (isEnabled) {
    void refreshSource(host, source)
  }

  return {
    text: isEnabled
      ? `Enabled "${source.name}"; it refreshes now.`
      : `Disabled "${source.name}"; it is kept but no longer fetched or shown.`,
  }
}
