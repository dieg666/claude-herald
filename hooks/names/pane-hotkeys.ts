/**
 * The pane's own Buttons by element key, each with its hotkey; the All tab always l (no band or pane key uses it), source tabs take the digits 1 to 9 in order, the stack tab always y, the saved tab always 0.
 */
export const PANE_HOTKEYS = {
  all: 'l',
  up: 'k',
  down: 'j',
  read: 'r',
  releases: 'e',
  stack: 'y',
  saved: '0',
} as const
