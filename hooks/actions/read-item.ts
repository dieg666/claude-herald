import type { Item } from '../../types/index.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { addRead } from '../store/add-read.js'

/**
 * Records a news item as read in the store, then mirrors the read ids to state; a stack item is never recorded; a failure is logged to debug, never thrown.
 *
 * @param host the engine
 * @param item the item opened or copied
 * @returns whether the item is recorded as read now
 */
export async function readItem(host: Host, item: Item): Promise<boolean> {
  if (isStackItem(item)) {
    return false
  }

  try {
    const read = await addRead(host, item.sourceId, [item.id])

    await host.state.read.update(() => read)

    return true
  } catch (error) {
    host.debug(`herald: could not record ${item.id} as read: ${messageOf(error)}`)

    return false
  }
}
