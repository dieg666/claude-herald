import type { CommandRunInput } from 'claude-code'

/**
 * The `/peek` command of the state-peek mod, as typed at the prompt.
 */
export const PEEK: CommandRunInput = {
  command: 'peek',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
}
