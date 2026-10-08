import { parseFeed } from '../feed/parse-feed.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { messageOf } from '../refresh/message-of.js'
import { loadSources } from '../store/load-sources.js'
import { addRefusalOf } from './add-refusal-of.js'
import type { CommandReply } from './command-reply.js'
import { httpUrlOf } from './http-url-of.js'
import { looksLikeHtml } from './looks-like-html.js'
import { pageTitleOf } from './page-title-of.js'
import { saveNewSource } from './save-new-source.js'
import { sourceNameOf } from './source-name-of.js'
import { wordsOf } from './words-of.js'

/**
 * `/herald add-page <url> [name]`: follows a web page once it fetches as HTML, named after its title unless named; its items are extracted on refresh.
 *
 * @param host the engine
 * @param rest what follows `add-page`
 */
export async function addPage(host: Host, rest: string): Promise<CommandReply> {
  const [address = '', ...words] = wordsOf(rest)
  const url = httpUrlOf(address)

  if (url === undefined) {
    return {
      text: `"${address}" is not an http(s) address. Usage: /${COMMAND_NAME} add-page <url> [name]`,
    }
  }

  const name = sourceNameOf(words.join(' ')) || undefined
  const refusal = addRefusalOf(await loadSources(host), url.href, name)

  if (refusal !== undefined) {
    return { text: refusal }
  }

  let response: Awaited<ReturnType<Host['httpFetch']>>

  try {
    response = await host.httpFetch(url.href)
  } catch (error) {
    return { text: `Could not fetch ${url.href} (${messageOf(error)}), so it was not added.` }
  }

  if (!response.ok) {
    return { text: `${url.href} answered HTTP ${response.status}, so it was not added.` }
  }

  if (!looksLikeHtml(response.text)) {
    return {
      text: parseFeed(response.text, url.href).ok
        ? `${url.href} is a feed, not a web page; use /${COMMAND_NAME} add ${url.href}.`
        : `${url.href} is not an HTML page, so it was not added.`,
    }
  }

  const saved = await saveNewSource(host, {
    url: url.href,
    kind: 'page',
    name,
    title: sourceNameOf(pageTitleOf(response.text)) || url.hostname,
  })

  if ('error' in saved) {
    return { text: saved.error }
  }

  return {
    text: `Added the page "${saved.source.name}". Haiku reads its headlines on each refresh where the page changed.`,
  }
}
