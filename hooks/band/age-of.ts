import { timeOf } from '../items/time-of.js'
import { AGE_AHEAD_MS } from './age-ahead-ms.js'

/**
 * How old an item is, in at most `AGE_COLUMNS` cells: `now` under a minute, then `5m`, `2h`, `1d` to `6d`, `1w` to `4w`, `1mo` to `12mo` and `1y` to `99y`, each rounded down; a date a little ahead of the clock reads `now`; undefined for no date, an unparsable one or one further ahead than `AGE_AHEAD_MS`.
 *
 * @param publishedAt the item's ISO 8601 date
 * @param now the clock, in milliseconds since the epoch
 */
export function ageOf(publishedAt: string | undefined, now: number): string | undefined {
  const time = timeOf(publishedAt)

  if (time === Number.NEGATIVE_INFINITY || !Number.isFinite(now) || time - now > AGE_AHEAD_MS) {
    return undefined
  }

  const minutes = Math.floor((now - time) / 60_000)

  if (minutes < 1) {
    return 'now'
  }

  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours}h`
  }

  const days = Math.floor(hours / 24)

  if (days < 7) {
    return `${days}d`
  }

  if (days < 30) {
    return `${Math.floor(days / 7)}w`
  }

  return days < 365 ? `${Math.floor(days / 30)}mo` : `${Math.min(99, Math.floor(days / 365))}y`
}
