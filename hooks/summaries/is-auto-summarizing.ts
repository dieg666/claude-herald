import type { Host } from '../host/host.js'
import { loadSettings } from '../store/load-settings.js'

/**
 * Whether one-line summaries are asked for on their own, by the stored `autoSummaries` setting; a store failure is thrown to the caller.
 *
 * @param host the engine
 */
export async function isAutoSummarizing(host: Host): Promise<boolean> {
  return (await loadSettings(host)).autoSummaries
}
