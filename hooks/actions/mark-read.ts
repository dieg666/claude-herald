import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { removeSaved } from '../store/remove-saved.js'
import { titleLineOf } from './title-line-of.js'

/**
 * Marks a saved item as read: removes it from the saved list in the store, then mirrors the list to state; a failure is toasted, never thrown.
 *
 * @param host the engine
 * @param item the saved item
 * @returns whether the item is off the saved list now
 */
export async function markRead(host: Host, item: Item): Promise<boolean> {
  try {
    const saved = await removeSaved(host, item.id)

    await host.state.saved.update(() => saved)

    return !saved.some(entry => entry.id === item.id)
  } catch (error) {
    host.debug(`news: could not mark ${item.id} as read: ${messageOf(error)}`)
    host.toast(`Could not mark "${titleLineOf(item.title)}" as read: ${messageOf(error)}`)

    return false
  }
}
