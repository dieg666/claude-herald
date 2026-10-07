/**
 * Bounds on one refresh run: how much it reads and how much it asks the model for.
 */
export const REFRESH_LIMITS = {
  /** Sources fetched at the same time. */
  concurrentSources: 3,
  /** Characters of a page's markup read before it becomes text. */
  pageHtmlChars: 2_000_000,
  /** The extraction reply's token cap, room for 30 items with long titles and addresses. */
  extractionMaxTokens: 3000,
  /** How long one extraction may take before it resolves aborted. */
  extractionTimeoutMs: 45_000,
} as const
