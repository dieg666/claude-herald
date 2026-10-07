import { CONTROL_CHARACTERS } from './control-characters.js'

/**
 * Text with invisible characters removed and every run of whitespace turned into one space.
 *
 * @param text the raw text
 * @returns the collapsed text, not trimmed
 */
export const collapsedTextOf = (text: string) =>
  text.replace(CONTROL_CHARACTERS, '').replace(/\s+/g, ' ')
