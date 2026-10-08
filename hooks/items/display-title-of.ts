import { isVersionOnly } from './is-version-only.js'

/**
 * The headline where the source is not implied: `<source> <version>` for a title that is only a version, else the title as it is.
 *
 * @param title the item's headline, as one line
 * @param sourceName the item's source name, undefined when the source is gone
 */
export function displayTitleOf(title: string, sourceName: string | undefined): string {
  const name = sourceName?.trim() ?? ''

  return name === '' || !isVersionOnly(title) ? title : `${name} ${title.trim()}`
}
