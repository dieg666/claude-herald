/** Text cut to at most `max` characters at a word boundary, an ellipsis marking the cut. */
export function clipText(text: string, max: number): string {
  if (text.length <= max) {
    return text
  }

  let cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')

  if (space > max * 0.6) {
    cut = cut.slice(0, space)
  }

  const last = cut.charCodeAt(cut.length - 1)

  if (last >= 0xd800 && last <= 0xdbff) {
    cut = cut.slice(0, -1)
  }

  return `${cut.trimEnd()}\u2026`
}
