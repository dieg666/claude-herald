import type { CommandRunInput } from 'claude-code'

/**
 * The `/close-pane` command of the pane-closer mod, as typed at the prompt.
 */
export const CLOSE_PANE: CommandRunInput = {
  command: 'close-pane',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
}
