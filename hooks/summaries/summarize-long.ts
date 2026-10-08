import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { currentSummaryLang } from './current-summary-lang.js'
import { summarize } from './summarize.js'
import type { SummaryJobs } from './summary-jobs.js'

/**
 * An item's 3-5 line summary in the current language, cached under kind `long`; undefined, with no model call, for an item without usable text, and undefined when the model gives none; never throws.
 *
 * @param host the engine
 * @param jobs the limiter and write queue
 * @param item the item
 * @param signal aborts the model call
 */
export async function summarizeLong(
  host: Host,
  jobs: SummaryJobs,
  item: Item,
  signal?: AbortSignal,
): Promise<string | undefined> {
  try {
    return await summarize(host, jobs, item, await currentSummaryLang(host), 'long', signal)
  } catch (error) {
    host.debug(`herald: no long summary of ${item.id}: ${messageOf(error)}`)

    return undefined
  }
}
