import type { CommandRunInput } from 'claude-code'

/**
 * `/news` with those arguments, as typed at the prompt.
 *
 * @param args everything after `/news`
 */
export function newsOf(args: string): CommandRunInput {
  return {
    command: 'news',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 120 },
  }
}
