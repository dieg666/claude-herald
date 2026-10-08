import type { Item } from '../../types/index.js'
import type { Host } from '../host/host.js'
import { messageOf } from '../refresh/message-of.js'
import { summarizeLong } from '../summaries/summarize-long.js'
import type { SummaryJobs } from '../summaries/summary-jobs.js'
import { summaryTextOf } from '../summaries/summary-text-of.js'
import { NO_TEXT_LINE } from './no-text-line.js'
import { titleLineOf } from './title-line-of.js'

/**
 * Shows an item's 3-5 line summary in the transcript, its title first, one dim line each, without starting a turn; an item without usable text gets a line saying so, with no model call; toasts when there is no summary; never throws.
 *
 * @param host the engine
 * @param jobs the limiter and write queue the summaries share
 * @param item the item
 * @returns whether a summary was shown
 */
export async function summarizeItem(host: Host, jobs: SummaryJobs, item: Item): Promise<boolean> {
  const title = titleLineOf(item.title)

  try {
    if (summaryTextOf(item) === '') {
      host.log(title)
      host.log(NO_TEXT_LINE)

      return false
    }

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
