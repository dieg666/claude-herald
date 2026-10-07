import { balancedEnd } from './balanced-end.js'
import { withoutTrailingCommas } from './without-trailing-commas.js'

const MAX_TEXT = 200_000

const MAX_FAILED_STARTS = 64

const parsed = (json: string): { value: unknown } | undefined => {
  for (const candidate of [json, withoutTrailingCommas(json)]) {
    try {
      return { value: JSON.parse(candidate) as unknown }
    } catch {
      // Try the repaired text, then give up on this start.
    }
  }

  return undefined
}

/**
 * The JSON arrays in a reply, in order, wherever they sit: bare, fenced or between sentences.
 *
 * @param reply the model's reply
 * @returns the arrays found lazily, including the one array an object wraps; trailing commas are tolerated
 */
export function* jsonArraysIn(reply: string): Generator<unknown[]> {
  const text = reply.slice(0, MAX_TEXT)
  const opener = /[[{]/g
  let failures = 0
  let index = 0

  while (index < text.length && failures < MAX_FAILED_STARTS) {
    opener.lastIndex = index

    const found = opener.exec(text)

    if (found === null) {
      return
    }

    const open = found.index
    const end = balancedEnd(text, open)
    const value = end === -1 ? undefined : parsed(text.slice(open, end))

    if (value === undefined) {
      failures++
      index = open + 1
      continue
    }

    index = end

    if (Array.isArray(value.value)) {
      yield value.value as unknown[]
    } else if (typeof value.value === 'object' && value.value !== null) {
      const wrapped = Object.values(value.value).filter(Array.isArray)

      if (wrapped.length === 1) {
        yield wrapped[0] as unknown[]
      }
    }
  }
}
