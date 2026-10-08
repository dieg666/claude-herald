import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { summarizeLong } from '../summaries/summarize-long.js'
import type { SummaryJobs } from '../summaries/summary-jobs.js'
import { titleLineOf } from './title-line-of.js'

/**
 * Shows an item's 3-5 line summary in the transcript, its title first, one dim line each, without starting a turn; toasts when there is none; never throws.
 *
 * @param host the engine
 * @param jobs the limiter and write queue the summaries share
 * @param item the item
 * @returns whether a summary was shown
 */
export async function summarizeItem(host: Host, jobs: SummaryJobs, item: Item): Promise<boolean> {
  const title = titleLineOf(item.title)

  try {
    const summary = await summarizeLong(host, jobs, item)

    if (summary === undefined) {
      host.toast(`No summary of "${title}" right now; try again later.`)

      return false
    }

    for (const line of [title, ...summary.split('\n')]) {
      host.log(line)
    }

    return true
  } catch (error) {
    host.debug(`herald: could not show the summary of ${item.id}: ${messageOf(error)}`)
    host.toast(`No summary of "${title}" right now; try again later.`)

    return false
  }
}
