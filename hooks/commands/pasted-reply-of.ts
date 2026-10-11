import type { CommandReply } from './command-reply.js'
import type { PastedAnswer } from './pasted-answer.js'

/**
 * One reply for a paste of several commands: each answer under its heading, a closing block listing the commands left unrun when it was interrupted, and every follow-up any answer asked for.
 *
 * @param answers what each command that ran answered, in order
 * @param unrun the commands, as pasted, that did not run because `/herald` was interrupted
 */
export function pastedReplyOf(
  answers: readonly PastedAnswer[],
  unrun: readonly string[] = [],
): CommandReply {
  const blocks = answers.map(({ heading, reply }) => `${heading}\n${reply.text}`)

  if (unrun.length > 0) {
    blocks.push(['Interrupted, so these commands did not run:', ...unrun].join('\n'))
  }

  const followUps: Record<string, boolean> = {}

  for (const { reply } of answers) {
    for (const [key, value] of Object.entries(reply)) {
      if (key !== 'text' && value === true) {
        followUps[key] = true
      }
    }
  }

  return { ...(followUps as Omit<CommandReply, 'text'>), text: blocks.join('\n\n') }
}
