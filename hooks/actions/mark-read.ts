import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { removeSaved } from '../store/remove-saved.js'
import { readItem } from './read-item.js'
import { titleLineOf } from './title-line-of.js'

/**
 * Marks a saved item as read: removes it from the saved list in the store, mirrors the list to state and, when it was saved and its source still exists, records it as read; a failure is toasted, never thrown.
 *
 * @param host the engine
 * @param item the saved item
 * @returns whether the item is off the saved list now
 */
export async function markRead(host: Host, item: Item): Promise<boolean> {
  try {
    const before = await host.state.saved.read()
    const saved = await removeSaved(host, item.id)

    await host.state.saved.update(() => saved)

    const sources = await host.state.sources.read()

    if (
      before.some(entry => entry.id === item.id) &&
      sources.some(source => source.id === item.sourceId)
    ) {
      await readItem(host, item)
    }

    return !saved.some(entry => entry.id === item.id)
  } catch (error) {
    host.debug(`herald: could not mark ${item.id} as read: ${messageOf(error)}`)
    host.toast(`Could not mark "${titleLineOf(item.title)}" as read: ${messageOf(error)}`)

    return false
  }
}
