import { isoDateOf } from './iso-date-of.js'
import { rfc822DateOf } from './rfc822-date-of.js'

/** A feed date, ISO 8601 or RFC 822, as an ISO UTC string, or undefined when unparseable. */
export function parseDate(text: string | undefined): string | undefined {
  const trimmed = text?.trim().slice(0, 64) ?? ''

  return trimmed === '' ? undefined : (isoDateOf(trimmed) ?? rfc822DateOf(trimmed))
}
