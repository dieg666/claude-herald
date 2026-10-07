import type { Source } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { contentHashOf } from '../page/content-hash-of.js'
import { extractionRequestOf } from '../page/extraction-request-of.js'
import { htmlToText } from '../page/html-to-text.js'
import { parseExtracted } from '../page/parse-extracted.js'
import { loadPageHashes } from '../store/load-page-hashes.js'
import type { Fetched } from './fetched.js'
import { itemsOfExtracted } from './items-of-extracted.js'
import { messageOf } from './message-of.js'
import { REFRESH_LIMITS } from './refresh-limits.js'

/**
 * A page source's items, extracted by the model only when the page text's hash differs from the stored one; fails when the model gives no usable item.
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

  const pageHash = contentHashOf(text)

  if ((await loadPageHashes(host))[source.id] === pageHash) {
    return { kind: 'unchanged' }
  }

  const { system, prompt } = extractionRequestOf(source.url, text)

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

  const items = itemsOfExtracted(source.id, parseExtracted(reply.text, source.url))

  return items.length === 0
    ? { kind: 'failed', reason: 'no items extracted' }
    : { kind: 'items', items, pageHash }
}
