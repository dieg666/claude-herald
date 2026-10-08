/**
 * Month abbreviations, January first.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * An item's date as the pane draws it, `Oct 8` (UTC); undefined when absent or unparsable.
 *
 * @param publishedAt the item's ISO 8601 date
 */
export function shortDateOf(publishedAt: string | undefined): string | undefined {
  const time = publishedAt === undefined ? Number.NaN : Date.parse(publishedAt)

  if (Number.isNaN(time)) {
    return undefined
  }

  const date = new Date(time)

  return `${MONTHS[date.getUTCMonth()] ?? ''} ${date.getUTCDate()}`
}
