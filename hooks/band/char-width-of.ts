/**
 * Code points a terminal draws two cells wide: East Asian wide and full-width forms, and emoji (an approximation of East_Asian_Width W and F).
 */
const WIDE =
  /[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦\u{1f300}-\u{1f64f}\u{1f900}-\u{1f9ff}\u{20000}-\u{3fffd}]/u

/**
 * The cells one code point takes in a terminal: none for a combining mark, two for a wide one, else one.
 *
 * @param char one code point
 */
export function charWidthOf(char: string): number {
  if (/\p{M}/u.test(char)) {
    return 0
  }

  return WIDE.test(char) ? 2 : 1
}
