import { COMMAND_NAME } from '../names/command-name.js'
import { messageOf } from '../refresh/message-of.js'
import { pastedCommandsOf } from './pasted-commands-of.js'

/**
 * The one-line answer when the engine reports `/herald` itself failed: what went wrong in plain words, and for a paste of several commands that those before the failure may already have applied.
 *
 * @param error why the hook failed: its kind and, for a throw, what was thrown
 * @param args everything after `/herald`, line breaks kept
 */
export function failureTextOf(
  error: { readonly kind: 'throw' | 'timeout' | 're-entry'; readonly message?: string },
  args: string,
): string {
  const reasons = {
    timeout: 'it took too long and was stopped',
    're-entry': 'it was called again while it was still running',
    throw: error.message === undefined ? 'an unexpected error' : messageOf(error.message),
  }
  const base = `/${COMMAND_NAME} failed: ${reasons[error.kind]}.`

  if (pastedCommandsOf(args).length <= 1) {
    return base
  }

  return `${base} Commands pasted before the failure may already have applied; /${COMMAND_NAME} list shows the current state.`
}
