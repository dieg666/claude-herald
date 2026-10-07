import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { applySettings } from './apply-settings.js'
import type { CommandReply } from './command-reply.js'
import { TEMPLATE_PLACEHOLDERS } from './template-placeholders.js'

/**
 * The longest template, in characters.
 */
const TEMPLATE_CHARS = 1000

/**
 * The template as typed, one pair of quotes around the whole of it removed.
 *
 * @param rest what follows `template`
 */
function unquoted(rest: string): string {
  const match = /^(["'])([\s\S]*)\1$/.exec(rest)

  return (match?.[2] ?? rest).trim()
}

/**
 * `/news template <text>`: saves the copy-for-Claude text, which must name the item by `{title}` or `{url}` and use no other placeholder than `{title}`, `{url}` and `{source}`.
 *
 * @param host the engine
 * @param rest what follows `template`, spacing kept
 */
export async function setTemplate(host: Host, rest: string): Promise<CommandReply> {
  const template = unquoted(rest)
  const allowed = TEMPLATE_PLACEHOLDERS.join(', ')
  const unknown = (template.match(/\{[^{}\s]*\}/g) ?? []).filter(
    placeholder => !(TEMPLATE_PLACEHOLDERS as readonly string[]).includes(placeholder),
  )

  if (unknown.length > 0) {
    return { text: `The template may use ${allowed}; ${unknown.join(', ')} is not one of them.` }
  }

  if (!template.includes('{title}') && !template.includes('{url}')) {
    return {
      text: `The template must hold {title} or {url}, e.g. /${COMMAND_NAME} template Does this affect us? {title} {url}`,
    }
  }

  if (template.length > TEMPLATE_CHARS) {
    return { text: `The template is ${template.length} characters; the most is ${TEMPLATE_CHARS}.` }
  }

  await applySettings(host, { template })

  return { text: `Copy for Claude now copies: ${template}` }
}
