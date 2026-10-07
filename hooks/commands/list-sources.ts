import type { Host } from '../host/host.js'
import { loadItems } from '../store/load-items.js'
import { loadSources } from '../store/load-sources.js'
import type { CommandReply } from './command-reply.js'
import { listTextOf } from './list-text-of.js'

/**
 * `/news list`: every source, enabled or not, its kind, how many items it keeps and its last error.
 *
 * @param host the engine
 */
export async function listSources(host: Host): Promise<CommandReply> {
  const sources = await loadSources(host)
  const items = await loadItems(host)
  const { errors } = await host.state.status.read()

  return { text: listTextOf(sources, items, errors) }
}
