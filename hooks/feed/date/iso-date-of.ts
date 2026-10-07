import { utcIsoOf } from './utc-iso-of.js'

const ISO =
  /^(\d{4})-(\d{2})-(\d{2})(?:[Tt ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?\s*(?:([Zz])|([+-])(\d{2}):?(\d{2})?)?)?$/

/** An ISO 8601 / RFC 3339 date (Atom, `dc:date`) as an ISO UTC string; no zone means UTC. */
export function isoDateOf(text: string): string | undefined {
  const parts = ISO.exec(text)

  if (!parts) {
    return undefined
  }

  const [, year, month, day, hour, minute, second, fraction, , sign, offsetHours, offsetMinutes] =
    parts
  const offset = sign
    ? (sign === '-' ? -1 : 1) * (Number(offsetHours) * 60 + Number(offsetMinutes ?? 0))
    : 0

  return utcIsoOf(
    Number(year),
    Number(month),
    Number(day),
    Number(hour ?? 0),
    Number(minute ?? 0),
    Number(second ?? 0),
    Math.floor(Number(`0.${fraction ?? '0'}`) * 1000),
    offset,
  )
}
