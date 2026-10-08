import type { Item } from '../../types/index.js'
import type { PanePage } from './pane-page.js'

/**
 * The items a page shows in the order their summaries are asked for: on a news or saved tab the selected item first, then the rest of the window in order; the stack tab's as shown.
 *
 * @param page the page shown
 */
export function shownSelectedFirstOf(page: PanePage): readonly Item[] {
  const selected = page.items[page.selected]

  if (page.stack !== undefined || selected === undefined || !page.shown.includes(selected)) {
    return page.shown
  }

  return [selected, ...page.shown.filter(item => item !== selected)]
}
