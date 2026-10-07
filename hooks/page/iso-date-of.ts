const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
]

const ISO =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?)?$/i

const DAY_FIRST =
  /^(?:[A-Za-z]{3,9},?\s+)?(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]{3,9})\.?,?[\s-]+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(GMT|UTC|Z|[+-]\d{4})?)?$/i

const MONTH_FIRST =
  /^(?:[A-Za-z]{3,9},?\s+)?([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/i

const FIRST_YEAR = 1990

const LAST_YEAR = 2100

const monthOf = (word: string) => {
  const lower = word.toLowerCase()

  return lower.length < 3 ? 0 : MONTHS.findIndex(month => month.startsWith(lower)) + 1
}

const offsetMinutesOf = (zone: string | undefined) => {
  if (zone === undefined || /^(?:z|gmt|utc)$/i.test(zone)) {
    return 0
  }

  const digits = zone.slice(1).replace(':', '')
  const hours = Number.parseInt(digits.slice(0, 2), 10)
  const minutes = digits.length > 2 ? Number.parseInt(digits.slice(2, 4), 10) : 0

  return hours > 14 || minutes > 59
    ? undefined
    : (zone.startsWith('-') ? -1 : 1) * (hours * 60 + minutes)
}

type Parts = {
  year: number
  month: number
  day: number
  hour?: string
  minute?: string
  second?: string
  fraction?: string
  zone?: string
}

const isoOf = ({ year, month, day, hour, minute, second, fraction, zone }: Parts) => {
  const hours = Number.parseInt(hour ?? '0', 10)
  const minutes = Number.parseInt(minute ?? '0', 10)
  const seconds = Number.parseInt(second ?? '0', 10)
  const millis = Number.parseInt((fraction ?? '').slice(0, 3).padEnd(3, '0'), 10)
  const offset = offsetMinutesOf(zone)

  if (
    offset === undefined ||
    year < FIRST_YEAR ||
    year > LAST_YEAR ||
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  ) {
    return undefined
  }

  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds, millis))

  // Date.UTC rolls an impossible day (February 30) into the next month; refuse it.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined
  }

  return new Date(date.getTime() - offset * 60_000).toISOString()
}

/**
 * A date as an ISO 8601 timestamp. Reads `2026-09-22`, full ISO timestamps, `Sep 22, 2026`,
 * `22 September 2026` and RFC 2822 dates; a date without a time or zone is taken as UTC.
 *
 * @param value the date as the model or the page wrote it
 * @returns the timestamp, or undefined when it is not a string, not a date, or implausible
 */
export const isoDateOf = (value: unknown) => {
  if (typeof value !== 'string' || value.length > 64) {
    return undefined
  }

  const text = value.trim()
  const iso = ISO.exec(text)

  if (iso !== null) {
    return isoOf({
      year: Number(iso[1]),
      month: Number(iso[2]),
      day: Number(iso[3]),
      hour: iso[4],
      minute: iso[5],
      second: iso[6],
      fraction: iso[7],
      zone: iso[8],
    })
  }

  const dayFirst = DAY_FIRST.exec(text)

  if (dayFirst !== null) {
    const month = monthOf(dayFirst[2] ?? '')

    return month === 0
      ? undefined
      : isoOf({
          year: Number(dayFirst[3]),
          month,
          day: Number(dayFirst[1]),
          hour: dayFirst[4],
          minute: dayFirst[5],
          second: dayFirst[6],
          zone: dayFirst[7],
        })
  }

  const monthFirst = MONTH_FIRST.exec(text)
  const month = monthOf(monthFirst?.[1] ?? '')

  return monthFirst === null || month === 0
    ? undefined
    : isoOf({ year: Number(monthFirst[3]), month, day: Number(monthFirst[2]) })
}
