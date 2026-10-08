import type { Item, SummaryKind } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { loadSummaries } from '../store/load-summaries.js'
import { putSummary } from '../store/put-summary.js'
import { summaryKeyOf } from '../store/summary-key-of.js'
import { summaryOf } from '../store/summary-of.js'
import { currentSummaryLang } from './current-summary-lang.js'
import { longSummaryOf } from './long-summary-of.js'
import { runLimited } from './run-limited.js'
import { shortSummaryOf } from './short-summary-of.js'
import type { SummaryJobs } from './summary-jobs.js'
import { SUMMARY_LIMITS } from './summary-limits.js'
import { summaryRequestOf } from './summary-request-of.js'

/**
 * The cached text of an item in a language and kind, read from the store now.
 *
 * @param host the engine
 * @param item the item
 * @param lang the resolved language
 * @param kind short or long
 */
async function cachedOf(
  host: Host,
  item: Item,
  lang: string,
  kind: SummaryKind,
): Promise<string | undefined> {
  return summaryOf(await loadSummaries(host), item.id, lang, kind)
}

/**
 * Caches a summary and, for a one-line one still in the current language, mirrors it into state; a failed write is logged, the text kept.
 *
 * @param host the engine
 * @param jobs orders the writes
 * @param item the item
 * @param lang the resolved language
 * @param kind short or long
 * @param text the summary
 */
async function keep(
  host: Host,
  jobs: SummaryJobs,
  item: Item,
  lang: string,
  kind: SummaryKind,
  text: string,
): Promise<void> {
  try {
    await jobs.serially(async () => {
      await putSummary(host, { itemId: item.id, lang, kind, text })

      // The language may have changed while the model answered; state holds the current one only.
      if (kind === 'short' && (await currentSummaryLang(host)) === lang) {
        await host.state.summaries.update(current => ({ ...current, [item.id]: text }))
      }
    })
  } catch (error) {
    host.debug(`herald: could not keep the summary of ${item.id}: ${messageOf(error)}`)
  }
}

/**
 * Asks the model for a summary, once a slot is free, and caches what it answers.
 *
 * @param host the engine
 * @param jobs the limiter and write queue
 * @param item the item
 * @param lang the resolved language
 * @param kind short or long
 * @param signal aborts the model call
 */
async function requestOf(
  host: Host,
  jobs: SummaryJobs,
  item: Item,
  lang: string,
  kind: SummaryKind,
  signal: AbortSignal | undefined,
): Promise<string | undefined> {
  if (signal?.aborted === true) {
    return undefined
  }

  // A request that waited for a slot may find the summary cached meanwhile.
  const cached = await cachedOf(host, item, lang, kind)

  if (cached !== undefined) {
    return cached
  }

  const { system, prompt } = summaryRequestOf(item, lang, kind)
  const isShort = kind === 'short'

  const reply = await host.modelComplete(
    {
      model: 'haiku',
      system,
      prompt,
      maxTokens: isShort ? SUMMARY_LIMITS.shortMaxTokens : SUMMARY_LIMITS.longMaxTokens,
      timeoutMs: isShort ? SUMMARY_LIMITS.shortTimeoutMs : SUMMARY_LIMITS.longTimeoutMs,
      effort: 'low',
    },
    signal,
  )

  if (!reply.isAnswered) {
    host.debug(`herald: no ${kind} summary of ${item.id}: ${reply.reason}`)

    return undefined
  }

  const text = isShort ? shortSummaryOf(reply.text) : longSummaryOf(reply.text)

  if (text === undefined) {
    host.debug(`herald: no ${kind} summary of ${item.id}: blank reply`)

    return undefined
  }

  await keep(host, jobs, item, lang, kind, text)

  return text
}

/**
 * An item's summary in a resolved language: the cached one with no model call, else one Haiku request through the limiter (shared with a request for the same key already in flight), cached when answered; undefined on any failure, which is not cached, so a later call retries; never throws.
 *
 * @param host the engine
 * @param jobs the limiter and write queue
 * @param item the item
 * @param lang the resolved language, part of the cache key (never `user`)
 * @param kind short (one line) or long (3-5 lines)
 * @param signal aborts the model call
 */
export async function summarize(
  host: Host,
  jobs: SummaryJobs,
  item: Item,
  lang: string,
  kind: SummaryKind,
  signal?: AbortSignal,
): Promise<string | undefined> {
  try {
    const cached = await cachedOf(host, item, lang, kind)

    if (cached !== undefined) {
      return cached
    }

    return await runLimited(jobs.limiter, `summary|${summaryKeyOf(item.id, lang, kind)}`, () =>
      requestOf(host, jobs, item, lang, kind, signal),
    )
  } catch (error) {
    host.debug(`herald: no ${kind} summary of ${item.id}: ${messageOf(error)}`)

    return undefined
  }
}
