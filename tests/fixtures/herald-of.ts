import type { CommandRunInput } from 'claude-code'

/**
 * `/herald` with those arguments, as typed at the prompt.
 *
 * @param args everything after `/herald`
 */
export function heraldOf(args: string): CommandRunInput {
  return {
    command: 'herald',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  }
}
