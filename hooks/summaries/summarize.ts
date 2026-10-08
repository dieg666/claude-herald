import type { Item, SummaryKind } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { loadSummaries } from '../store/load-summaries.js'
import { putSummary } from '../store/put-summary.js'
import { summaryKeyOf } from '../store/summary-key-of.js'
import { summaryOf } from '../store/summary-of.js'
import { currentSummaryLang } from './current-summary-lang.js'
import { isMetaReply } from './is-meta-reply.js'
import { isMuted } from './is-muted.js'
import { longSummaryOf } from './long-summary-of.js'
import { runLimited } from './run-limited.js'
import { shortSummaryOf } from './short-summary-of.js'
import type { SummaryJobs } from './summary-jobs.js'
import { SUMMARY_LIMITS } from './summary-limits.js'
import { SUMMARY_PROMPT_VERSION } from './summary-prompt-version.js'
import { summaryRequestOf } from './summary-request-of.js'
import { summaryTextOf } from './summary-text-of.js'

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
      await putSummary(host, {
        itemId: item.id,
        lang,
        kind,
        version: SUMMARY_PROMPT_VERSION,
        text,
      })

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
 * Notes a rejected reply and, once the item is muted, marks its one-line summary in state as none (an empty text) while the language is still the current one; a failed write is logged.
 *
 * @param host the engine
 * @param jobs the rejections and write queue
 * @param item the item
 * @param lang the resolved language
 * @param kind short or long
 */
async function reject(
  host: Host,
  jobs: SummaryJobs,
  item: Item,
  lang: string,
  kind: SummaryKind,
): Promise<void> {
  const key = summaryKeyOf(item.id, lang, kind)
  const count = (jobs.rejected.get(key)?.count ?? 0) + 1
  const rejection = { itemId: item.id, lang, kind, count, at: await host.clockNow() }

  jobs.rejected.set(key, rejection)

  const muted = isMuted(rejection, rejection.at)

  host.debug(
    `herald: no ${kind} summary of ${item.id}: the reply describes the item${muted ? '; not asked again for an hour' : ''}`,
  )

  if (!muted || kind !== 'short') {
    return
  }

  try {
    await jobs.serially(async () => {
      if ((await currentSummaryLang(host)) === lang) {
        await host.state.summaries.update(current => ({ ...current, [item.id]: '' }))
      }
    })
  } catch (error) {
    host.debug(`herald: could not mark the summary of ${item.id}: ${messageOf(error)}`)
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

  if (isMetaReply(reply.text)) {
    await reject(host, jobs, item, lang, kind)

    return undefined
  }

  const text = isShort ? shortSummaryOf(reply.text) : longSummaryOf(reply.text)

  if (text === undefined) {
    host.debug(`herald: no ${kind} summary of ${item.id}: blank reply`)

    return undefined
  }

  jobs.rejected.delete(summaryKeyOf(item.id, lang, kind))
  await keep(host, jobs, item, lang, kind, text)

  return text
}

/**
 * An item's summary in a resolved language: nothing, with no model call, for an item without usable text; else the cached one with no model call, else one Haiku request through the limiter (shared with a request for the same key already in flight), cached when answered; undefined on any failure or on a reply that describes the item instead of the story, which is not cached, so a later call retries, except that after `SUMMARY_LIMITS.rejectedTries` rejected replies the item is not asked about for `SUMMARY_LIMITS.rejectedWindowMs`; never throws.
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
    if (summaryTextOf(item) === '') {
      return undefined
    }

    const cached = await cachedOf(host, item, lang, kind)

    if (cached !== undefined) {
      return cached
    }

    const key = summaryKeyOf(item.id, lang, kind)

    if (isMuted(jobs.rejected.get(key), await host.clockNow())) {
      return undefined
    }

    return await runLimited(jobs.limiter, `summary|${key}`, () =>
      requestOf(host, jobs, item, lang, kind, signal),
    )
  } catch (error) {
    host.debug(`herald: no ${kind} summary of ${item.id}: ${messageOf(error)}`)

    return undefined
  }
}
