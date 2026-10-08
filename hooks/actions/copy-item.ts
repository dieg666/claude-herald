import type { RenderSurface } from 'claude-code'

import type { Item } from '../../types/index.js'
import { isStackItem } from '../deps/stack/is-stack-item.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { loadSettings } from '../store/load-settings.js'
import { COPIED_TOAST } from './copied-toast.js'
import { copyTextOf } from './copy-text-of.js'
import { depsCopyTextOf } from './deps-copy-text-of.js'
import { copyWithTool } from './copy-with-tool.js'

/**
 * Copies an item for Claude (the template filled, the deps template for a stack item) to the clipboard of the surface pressed on, falling back to the platform's clipboard tools when the surface copied nothing; a refused copy is respected; toasts the outcome, never submits a prompt, never throws.
 *
 * @param host the engine
 * @param item the item
 * @param surface the surface the press came from
 * @returns whether the text reached a clipboard
 */
export async function copyItem(host: Host, item: Item, surface: RenderSurface): Promise<boolean> {
  try {
    const { template, depsTemplate } = await loadSettings(host)
    const source = (await host.state.sources.read()).find(entry => entry.id === item.sourceId)
    const text = isStackItem(item)
      ? depsCopyTextOf(depsTemplate, item)
      : copyTextOf(template, item, source?.name ?? item.sourceId)

    const copied = await host.copy(text, surface).catch((error: unknown) => ({
      isCopied: false as const,
      reason: messageOf(error),
    }))

    if (copied.isCopied) {
      host.toast(COPIED_TOAST)

      return true
    }

    if (copied.reason === 'refused') {
      host.toast('Not copied: the copy was refused.')

      return false
    }

    const failure = await copyWithTool(host, text)

    if (failure === undefined) {
      host.toast(COPIED_TOAST)

      return true
    }

    host.toast(`Could not copy: ${failure}`)

    return false
  } catch (error) {
    host.debug(`news: could not copy ${item.id}: ${messageOf(error)}`)
    host.toast(`Could not copy: ${messageOf(error)}`)

    return false
  }
}
