import type { Host } from '../host/host.js'
import { PANE_ID } from '../names/pane-id.js'
import { PANE_TITLE } from '../names/pane-title.js'
import { PANE_FIRST_WINDOW } from '../pane/pane-first-window.js'
import { viewShownTab } from '../pane/view-shown-tab.js'
import { messageOf } from '../refresh/message-of.js'
import { loadItems } from '../store/load-items.js'
import { loadSources } from '../store/load-sources.js'
import type { CommandReply } from './command-reply.js'
import { digestTextOf } from './digest-text-of.js'
import { hasDrawingSurface } from './has-drawing-surface.js'

/**
 * `/herald`: opens the pane where a surface draws one, recording what it shows as viewed (a source tab's items, or the rows in the All tab's window) once placed and asking for the summaries of the items it opens on; elsewhere, or when it cannot open, answers the latest items as text.
 *
 * @param host the engine
 * @param size how many items the pane's window may show, `PANE_FIRST_WINDOW` before it has drawn
 */
export async function showHerald(
  host: Host,
  size: number = PANE_FIRST_WINDOW,
): Promise<CommandReply> {
  const surfaces = await host.surfaces().catch(() => [])

  if (hasDrawingSurface(surfaces)) {
    try {
      const opened = await host.openPane({
        id: PANE_ID,
        title: PANE_TITLE,
        focus: true,
        closeOnEscape: true,
      })

      if (opened.isPlaced) {
        await viewShownTab(host, size)
      }

      return {
        text: opened.isPlaced
          ? 'Opened the Herald pane.'
          : `The Herald pane is open and shows once there is room: ${opened.reason}`,
        summarizePane: true,
      }
    } catch (error) {
      host.debug(`herald: could not open the pane: ${messageOf(error)}`)
    }
  }

  return { text: digestTextOf(await loadSources(host), await loadItems(host)) }
}
