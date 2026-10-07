/**
 * Text cut to at most `max` UTF-16 units without leaving half of a surrogate pair.
 *
 * @param text the text to cut
 * @param max the most units to keep
 * @returns the text, or its first units
 */
export const cutTo = (text: string, max: number) => {
  const limit = Math.max(0, Math.floor(max))

  if (text.length <= limit) {
    return text
  }

  const last = text.charCodeAt(limit - 1)
  const splitsPair = last >= 0xd800 && last <= 0xdbff

  return text.slice(0, splitsPair ? limit - 1 : limit)
}
