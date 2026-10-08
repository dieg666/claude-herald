import { displayTitleOf } from '../items/display-title-of.js'
import { isVersionOnly } from '../items/is-version-only.js'
import type { HeadlineLine } from './headline-line.js'
import { headlineLineOf } from './headline-line-of.js'

/**
 * A news item's headline line: its display title, and its source's name at the right end unless the title is only a version, which already leads with the name.
 *
 * @param title the item's headline, as one line
 * @param name the item's source name as one line, undefined when the source is gone
 * @param columns the cells the headline and the name may take together
 */
export function newsHeadlineOf(
  title: string,
  name: string | undefined,
  columns: number,
): HeadlineLine {
  return headlineLineOf(
    displayTitleOf(title, name),
    isVersionOnly(title) ? undefined : name,
    columns,
  )
}
