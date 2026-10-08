import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { addSaved } from '../store/add-saved.js'
import { titleLineOf } from './title-line-of.js'

/**
 * Saves an item for later in the store, then mirrors the saved list to state; an item already saved stays as it was; a failure is toasted, never thrown.
 *
 * @param host the engine
 * @param item the item
 * @returns whether the item is saved now
 */
export async function saveItem(host: Host, item: Item): Promise<boolean> {
  try {
    const saved = await addSaved(host, item, await host.clockNow())

    await host.state.saved.update(() => saved)

    return saved.some(entry => entry.id === item.id)
  } catch (error) {
    host.debug(`news: could not save ${item.id}: ${messageOf(error)}`)
    host.toast(`Could not save "${titleLineOf(item.title)}": ${messageOf(error)}`)

    return false
  }
}
