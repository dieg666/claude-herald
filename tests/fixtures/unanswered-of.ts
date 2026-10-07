import type { ModelCompleteResult } from 'claude-code'

/**
 * A model reply with no text: cut short (`aborted`) or empty (`empty-reply`).
 *
 * @param reason why it has no text
 */
export function unansweredOf(reason: 'aborted' | 'empty-reply'): ModelCompleteResult {
  return {
    isAnswered: false,
    reason,
    usage: {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  }
}
