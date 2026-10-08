import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { loadSummaries } from '../store/load-summaries.js'
import { summariesFor } from '../store/summaries-for.js'
import { currentSummaryLang } from './current-summary-lang.js'
import { summarize } from './summarize.js'
import type { SummaryJobs } from './summary-jobs.js'

/**
 * Whether two summary maps hold the same texts under the same ids.
 *
 * @param a one map
 * @param b the other
 */
function isSame(a: Readonly<Record<string, string>>, b: Readonly<Record<string, string>>) {
  const keys = Object.keys(a)

  return keys.length === Object.keys(b).length && keys.every(key => a[key] === b[key])
}

/**
 * One-line summaries for the items a view shows: state is first made to hold the cached summaries of the current language (replacing another language's), then every shown item without one is summarized through the limiter; never throws.
 *
 * @param host the engine
 * @param jobs the limiter and write queue
 * @param items the items shown
 * @param signal aborts the model calls
 * @returns the summaries of the shown items that exist now, by item id
 */
export async function ensureVisibleSummaries(
  host: Host,
  jobs: SummaryJobs,
  items: readonly Item[],
  signal?: AbortSignal,
): Promise<Record<string, string>> {
  try {
    const { lang, cached } = await jobs.serially(async () => {
      const lang = await currentSummaryLang(host)
      const cached = summariesFor(await loadSummaries(host), lang)

      if (!isSame(await host.state.summaries.read(), cached)) {
        await host.state.summaries.update(() => cached)
      }

      return { lang, cached }
    })

    const shown = [...new Map(items.map(item => [item.id, item])).values()]

    const texts = await Promise.all(
      shown.map(async item => {
        const text = cached[item.id] ?? (await summarize(host, jobs, item, lang, 'short', signal))

        return text === undefined ? [] : [[item.id, text] as const]
      }),
    )

    return Object.fromEntries(texts.flat())
  } catch (error) {
    host.debug(`herald: could not summarize the shown items: ${messageOf(error)}`)

    return {}
  }
}
