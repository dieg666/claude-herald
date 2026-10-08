import { cutTo } from '../page/cut-to.js'
import { REFRESH_LIMITS } from './refresh-limits.js'

/**
 * A toast cut at a word to fit `REFRESH_LIMITS.toastChars`, an ellipsis marking the cut.
 *
 * @param text the whole toast
 */
export function fitToast(text: string): string {
  const max = REFRESH_LIMITS.toastChars

  if (text.length <= max) {
    return text
  }

  const cut = cutTo(text, max - 1)
  const space = cut.lastIndexOf(' ')

  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`
}
