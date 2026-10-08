/**
 * Bounds on the model's breaking and security pass over release notes.
 */
export const RELEASE_LIMITS = {
  /** The reply's token cap: the JSON answer is about 15 tokens. */
  maxTokens: 60,
  /** How long one request may take before it resolves aborted. */
  timeoutMs: 20_000,
  /** Characters of the notes sent to the model. */
  notesChars: 4000,
  /** Characters of the title sent to the model. */
  titleChars: 300,
  /** The most releases one call sends to the model, in the order given; the rest keep their keyword flags until a later call. */
  modelPerCall: 12,
} as const
