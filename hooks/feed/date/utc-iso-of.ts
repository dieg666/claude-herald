/** Date parts as an ISO 8601 UTC string, or undefined when any part is out of range. */
export function utcIsoOf(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  offsetMinutes: number,
): string | undefined {
  if (
    year < 1000 ||
    year > 9999 ||
    hour > 23 ||
    minute > 59 ||
    second > 60 ||
    Math.abs(offsetMinutes) > 18 * 60
  ) {
    return undefined
  }

  const midnight = new Date(Date.UTC(year, month - 1, day))

  if (midnight.getUTCMonth() !== month - 1 || midnight.getUTCDate() !== day) {
    return undefined
  }

  const time =
    Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - offsetMinutes * 60_000

  return Number.isFinite(time) ? new Date(time).toISOString() : undefined
}
