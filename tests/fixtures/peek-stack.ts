import type { CommandRunInput } from 'claude-code'

/**
 * The `/peek-stack` command of the stack-peek mod, as typed at the prompt.
 */
export const PEEK_STACK: CommandRunInput = {
  command: 'peek-stack',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 120 },
}
