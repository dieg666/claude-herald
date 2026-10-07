/**
 * The longest source name, in characters.
 */
const NAME_CHARS = 60

/**
 * A source name from free text: control characters dropped, whitespace collapsed, capped; empty when nothing is left.
 *
 * @param text a typed name or a feed title
 */
export function sourceNameOf(text: string): string {
  const name = text
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return [...name].slice(0, NAME_CHARS).join('').trim()
}
