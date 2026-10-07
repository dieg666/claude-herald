import { MONTH_NUMBERS } from './month-numbers.js'
import { utcIsoOf } from './utc-iso-of.js'
import { ZONE_OFFSETS } from './zone-offsets.js'

const RFC822 =
  /^(?:[A-Za-z]{2,9}\.?,?\s*)?(\d{1,2})[\s-]+([A-Za-z]{3,9})\.?[\s-]+(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?(?:\s*(?:([+-])(\d{2}):?(\d{2})|([A-Za-z]{1,5})))?(?:\s*\([^()]*\))?$/

/** An RFC 822 date (`pubDate`) as an ISO UTC string; an unknown zone name reads as UTC. */
export function rfc822DateOf(text: string): string | undefined {
  const parts = RFC822.exec(text)

  if (!parts) {
    return undefined
  }

  const [, day, monthName, yearText, hour, minute, second, sign, offsetHours, offsetMinutes, zone] =
    parts
  const month = MONTH_NUMBERS.get((monthName ?? '').slice(0, 3).toLowerCase())

  if (month === undefined) {
    return undefined
  }

  const shortYear = Number(yearText)
  const year =
    (yearText ?? '').length === 2 ? shortYear + (shortYear < 50 ? 2000 : 1900) : shortYear
  const offset = sign
    ? (sign === '-' ? -1 : 1) * (Number(offsetHours) * 60 + Number(offsetMinutes))
    : (ZONE_OFFSETS.get((zone ?? '').toUpperCase()) ?? 0)

  return utcIsoOf(
    year,
    month,
    Number(day),
    Number(hour ?? 0),
    Number(minute ?? 0),
    Number(second ?? 0),
    0,
    offset,
  )
}
