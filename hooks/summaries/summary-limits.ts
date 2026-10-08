/**
 * Bounds on summary requests: how many run at once, how much each asks for and how long it may take.
 */
export const SUMMARY_LIMITS = {
  /** Model requests in flight at the same time, across every caller of the limiter. */
  concurrentRequests: 2,
  /** The one-line reply's token cap. */
  shortMaxTokens: 120,
  /** The 3-5 line reply's token cap. */
  longMaxTokens: 400,
  /** How long a one-line request may take before it resolves aborted. */
  shortTimeoutMs: 20_000,
  /** How long a 3-5 line request may take before it resolves aborted. */
  longTimeoutMs: 45_000,
  /** The longest one-line summary, in characters. */
  shortChars: 160,
  /** The longest line of a 3-5 line summary, in characters. */
  longLineChars: 300,
  /** The fewest and most lines of a long summary. */
  longMinLines: 3,
  longMaxLines: 5,
  /** Characters of an item's text sent to the model. */
  itemTextChars: 4000,
  /** Letters and digits an excerpt needs, once boilerplate is stripped, to count as text. */
  minExcerptChars: 16,
  /** Characters of an item's title sent to the model. */
  titleChars: 300,
  /** The most new items one refresh run summarizes, newest first. */
  newPerRun: 12,
  /** Rejected replies, for one item, language and kind, after which it is not asked about for the window. */
  rejectedTries: 2,
  /** How long an item stays unasked after its replies were rejected. */
  rejectedWindowMs: 60 * 60_000,
} as const
