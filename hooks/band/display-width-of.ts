import { charWidthOf } from './char-width-of.js'

/**
 * The cells a line of text takes in a terminal.
 *
 * @param text one line, control characters already removed
 */
export function displayWidthOf(text: string): number {
  let width = 0

  for (const char of text) {
    width += charWidthOf(char)
  }

  return width
}
