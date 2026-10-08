import type { Source } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { extractionRequestOf } from '../page/extraction-request-of.js'
import { htmlToText } from '../page/html-to-text.js'
import { pageHashOf } from '../page/page-hash-of.js'
import { parseExtracted } from '../page/parse-extracted.js'
import { withPageTeasers } from '../page/with-page-teasers.js'
import { loadPageHashes } from '../store/load-page-hashes.js'
import type { Fetched } from './fetched.js'
import { itemsOfExtracted } from './items-of-extracted.js'
import { messageOf } from './message-of.js'
import { REFRESH_LIMITS } from './refresh-limits.js'

/**
 * A page source's items, extracted by the model only when the hash of the page text and the extraction rules differs from the stored one, each teaser kept only when the page text holds it; an answered reply with no usable item yields none, with its hash, so the same page is not asked about again.
 *
 * @param host the engine
 * @param source the page source
 * @param signal aborts the model call
 */
export async function fetchPage(
  host: Host,
  source: Source,
  signal?: AbortSignal,
): Promise<Fetched> {
  let response: Awaited<ReturnType<Host['httpFetch']>>

  try {
    response = await host.httpFetch(source.url)
  } catch (error) {
    return { kind: 'failed', reason: `fetch failed: ${messageOf(error)}` }
  }

  if (!response.ok) {
    return { kind: 'failed', reason: `HTTP ${response.status}` }
  }

  const text = htmlToText(response.text.slice(0, REFRESH_LIMITS.pageHtmlChars), source.url)

  if (text === '') {
    return { kind: 'failed', reason: 'empty page' }
  }

  const request = extractionRequestOf(source.url, text)
  const pageHash = pageHashOf(request)

  if ((await loadPageHashes(host))[source.id] === pageHash) {
    return { kind: 'unchanged' }
  }

  const { system, prompt } = request

  const reply = await host.modelComplete(
    {
      model: 'haiku',
      system,
      prompt,
      maxTokens: REFRESH_LIMITS.extractionMaxTokens,
      timeoutMs: REFRESH_LIMITS.extractionTimeoutMs,
    },
    signal,
  )

  if (!reply.isAnswered) {
    return { kind: 'failed', reason: `model: ${reply.reason}` }
  }

  const items = itemsOfExtracted(
    source.id,
    withPageTeasers(parseExtracted(reply.text, source.url), text),
  )

  return { kind: 'items', items, pageHash }
}
