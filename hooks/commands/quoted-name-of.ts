/**
 * A source name as typed in a command: bare when it has no space or quote, else in the first quote kind it never holds before whitespace or at its end, so its words read back the name; bare when neither fits.
 *
 * @param name the source's name
 */
export function quotedNameOf(name: string): string {
  if (!/[\s"']/.test(name)) {
    return name
  }

  const quote = ['"', "'"].find(candidate => !new RegExp(`${candidate}(?:\\s|$)`).test(name))

  return quote === undefined ? name : `${quote}${name}${quote}`
}
