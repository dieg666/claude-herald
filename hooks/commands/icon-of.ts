/**
 * A source's glyph: the first ASCII letter or digit of its name, uppercased, else `*`.
 *
 * @param name the source's name
 */
export function iconOf(name: string): string {
  return /[A-Za-z0-9]/.exec(name)?.[0]?.toUpperCase() ?? '*'
}
