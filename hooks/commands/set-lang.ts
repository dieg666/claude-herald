import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { applySettings } from './apply-settings.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { langOf } from './lang-of.js'
import { mirrorSummaries } from './mirror-summaries.js'

/**
 * `/news lang <feed|user|code>`: saves the summary language and mirrors the summaries cached in it.
 *
 * @param host the engine
 * @param rest what follows `lang`
 */
export async function setLang(host: Host, rest: string): Promise<CommandReply> {
  const value = argumentOf(rest)
  const lang = langOf(value)

  if (lang === undefined) {
    return {
      text: `The summary language is feed (each item's own), user (Claude Code's language setting) or a language code such as es or pt-BR, e.g. /${COMMAND_NAME} lang es; "${value}" is none of them.`,
    }
  }

  await mirrorSummaries(host, await applySettings(host, { lang }))

  if (lang === 'feed') {
    return { text: "Summaries are written in each item's own language." }
  }

  return {
    text:
      lang === 'user'
        ? "Summaries are written in Claude Code's language setting (each item's own while it is unset)."
        : `Summaries are written in ${lang}.`,
  }
}
