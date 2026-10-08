import type { PaneWindow } from './pane-window.js'

/**
 * A pane window not drawn yet.
 */
export function paneWindowOf(): PaneWindow {
  return { size: undefined }
}
