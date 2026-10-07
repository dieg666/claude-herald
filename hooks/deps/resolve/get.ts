import type { FetchOutcome } from './fetch-outcome.js'

/**
 * Fetches one URL gently (backoff, cancellation); never rejects.
 */
export type Get = (url: string) => Promise<FetchOutcome>
