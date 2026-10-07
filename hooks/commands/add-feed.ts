import { parseFeed } from '../feed/parse-feed.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { itemsOfFeed } from '../refresh/items-of-feed.js'
import { messageOf } from '../refresh/message-of.js'
import { loadSources } from '../store/load-sources.js'
import { addRefusalOf } from './add-refusal-of.js'
import type { CommandReply } from './command-reply.js'
import { feedFailureTextOf } from './feed-failure-text-of.js'
import { httpUrlOf } from './http-url-of.js'
import { quotedNameOf } from './quoted-name-of.js'
import { saveNewSource } from './save-new-source.js'
import { sourceNameOf } from './source-name-of.js'
import { wordsOf } from './words-of.js'

/**
 * `/news add <url> [name]`: follows an RSS or Atom feed once it fetches and parses with entries, named after its title unless named; refuses anything else and saves nothing then.
 *
 * @param host the engine
 * @param rest what follows `add`
 */
export async function addFeed(host: Host, rest: string): Promise<CommandReply> {
  const [address = '', ...words] = wordsOf(rest)
  const url = httpUrlOf(address)

  if (url === undefined) {
    return {
      text: `"${address}" is not an http(s) address. Usage: /${COMMAND_NAME} add <url> [name]`,
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

  const parsed = parseFeed(response.text, url.href)

  if (!parsed.ok) {
    return { text: feedFailureTextOf(parsed.reason, url.href) }
  }

  const count = itemsOfFeed('new', parsed.feed).length

  if (count === 0) {
    return { text: `The feed at ${url.href} has no entries, so it was not added.` }
  }

  const saved = await saveNewSource(host, {
    url: url.href,
    kind: 'feed',
    name,
    title: sourceNameOf(parsed.feed.title) || url.hostname,
  })

  if ('error' in saved) {
    return { text: saved.error }
  }

  return {
    text: `Added "${saved.source.name}" with ${count} ${count === 1 ? 'entry' : 'entries'}. /${COMMAND_NAME} remove ${quotedNameOf(saved.source.name)} stops following it.`,
  }
}
