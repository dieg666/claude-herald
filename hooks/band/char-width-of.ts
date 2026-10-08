import { WIDE_RANGES } from './wide-ranges.js'

/**
 * The cells one code point takes in a terminal: none for a combining mark or variation selector, two for a wide one, else one.
 *
 * @param char one code point
 */
export function charWidthOf(char: string): number {
  if (/\p{M}/u.test(char)) {
    return 0
  }

  const code = char.codePointAt(0) ?? 0

  return WIDE_RANGES.some(([low, high]) => code >= low && code <= high) ? 2 : 1
}
