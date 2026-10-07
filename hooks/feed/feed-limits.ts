/** Bounds that keep parsing linear on hostile input and keep its output small. */
export const FEED_LIMITS = {
  /** Longest summary kept, in characters, before an ellipsis. */
  summaryChars: 500,
  /** Longest title kept, in characters, before an ellipsis. */
  titleChars: 300,
  /** How much of an HTML body is read to build its summary. */
  htmlSourceChars: 20_000,
  /** Deepest element nesting kept as a tree; deeper markup only adds text. */
  depth: 64,
  /** How many open elements an end tag searches for its match. */
  endTagReach: 16,
  /** Extra entity-decoding passes a title gets for double-encoded text. */
  entityPasses: 3,
} as const
