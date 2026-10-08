import { displayWidthOf } from './display-width-of.js'

/** The hotkey, the colon and the space before a label. */
const HOTKEY_PREFIX_COLUMNS = 3

/**
 * The cells a Button takes in the terminal: its one-letter hotkey, a colon and a space, then its label.
 *
 * @param label the Button's label
 */
export function buttonColumnsOf(label: string): number {
  return displayWidthOf(label) + HOTKEY_PREFIX_COLUMNS
}
