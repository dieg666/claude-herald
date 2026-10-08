import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { applySettings } from './apply-settings.js'
import type { CommandReply } from './command-reply.js'
import { TEMPLATE_MAX_CHARS } from './template-max-chars.js'
import { TEMPLATE_PLACEHOLDERS } from './template-placeholders.js'
import { templateTextOf } from './template-text-of.js'

/**
 * `/herald template <text>`: saves the copy-for-Claude text, which must name the item by `{title}` or `{url}` and use no other placeholder than `{title}`, `{url}` and `{source}`.
 *
 * @param host the engine
 * @param rest what follows `template`, spacing kept
 */
export async function setTemplate(host: Host, rest: string): Promise<CommandReply> {
  const template = templateTextOf(rest)
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

  if (template.length > TEMPLATE_MAX_CHARS) {
    return {
      text: `The template is ${template.length} characters; the most is ${TEMPLATE_MAX_CHARS}.`,
    }
  }

  await applySettings(host, { template })

  return { text: `Copy for Claude now copies: ${template}` }
}
