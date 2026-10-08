import { ageOf } from '../band/age-of.js'
import { timeOf } from '../items/time-of.js'
import { shortDateOf } from './short-date-of.js'

/**
 * A day, in milliseconds: an item younger than this shows as an age.
 */
const DAY_MS = 86_400_000

/**
 * An item's date as the pane draws it, in at most `PANE_DATE_COLUMNS` cells: the band's age (`now`, `5m`, `2h`) while the item is less than a day old, else the short date (`Oct 7`); a date ahead of the clock by more than the band tolerates reads as the short date; undefined when absent or unparsable. A `now` that is not a number draws the short date.
 *
 * @param publishedAt the item's ISO 8601 date
 * @param now the clock, in milliseconds since the epoch
 */
export function paneDateOf(publishedAt: string | undefined, now: number): string | undefined {
  const time = timeOf(publishedAt)

  if (Number.isFinite(time) && now - time < DAY_MS) {
    const age = ageOf(publishedAt, now)

    if (age !== undefined) {
      return age
    }
  }

  return shortDateOf(publishedAt)
}
