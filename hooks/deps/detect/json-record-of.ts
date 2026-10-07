import { isRecord } from '../../store/is-record.js'

/**
 * A JSON document that must be an object; throws otherwise.
 *
 * @param text the file's text
 */
export function jsonRecordOf(text: string): Record<string, unknown> {
  const value: unknown = JSON.parse(text.replace(/^﻿/, ''))

  if (!isRecord(value)) {
    throw new Error('not a JSON object')
  }

  return value
}
