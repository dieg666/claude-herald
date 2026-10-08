import type { Host } from '../host/host.js'
import { applySettings } from './apply-settings.js'
import type { CommandReply } from './command-reply.js'
import { DEPS_TEMPLATE_PLACEHOLDERS } from './deps-template-placeholders.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { TEMPLATE_MAX_CHARS } from './template-max-chars.js'
import { templateTextOf } from './template-text-of.js'

/**
 * `/herald deps template <text>`: saves the copy-for-Claude text of a dependency release, for every project, which must name the release by `{pkg}` or `{url}` and use no other placeholder than `{pkg}`, `{current}`, `{new}` and `{url}`; quotes as `/herald template` reads them.
 *
 * @param host the engine
 * @param rest what follows `template`, spacing kept
 */
export async function setDepsTemplate(host: Host, rest: string): Promise<CommandReply> {
  const template = templateTextOf(rest)
  const allowed = DEPS_TEMPLATE_PLACEHOLDERS.join(', ')
  const unknown = (template.match(/\{[^{}\s]*\}/g) ?? []).filter(
    placeholder => !(DEPS_TEMPLATE_PLACEHOLDERS as readonly string[]).includes(placeholder),
  )

  if (unknown.length > 0) {
    return depsRefusalOf(
      'template',
      `The template may use ${allowed}; ${unknown.join(', ')} is not one of them.`,
    )
  }

  if (!template.includes('{pkg}') && !template.includes('{url}')) {
    return depsRefusalOf('template', 'The template must hold {pkg} or {url}.')
  }

  if (template.length > TEMPLATE_MAX_CHARS) {
    return depsRefusalOf(
      'template',
      `The template is ${template.length} characters; the most is ${TEMPLATE_MAX_CHARS}.`,
    )
  }

  await applySettings(host, { depsTemplate: template })

  return { text: `Copy for Claude now copies, for a dependency release: ${template}` }
}
