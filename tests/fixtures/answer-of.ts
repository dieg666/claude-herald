import type { ModelCompleteResult } from 'claude-code'

/**
 * A model reply that answered with that text.
 *
 * @param text the reply's text
 */
export function answerOf(text: string): ModelCompleteResult {
  return {
    isAnswered: true,
    text,
    usage: {
      input_tokens: 1,
      output_tokens: 1,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    },
  }
}
