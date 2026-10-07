/**
 * Bounds on resolving packages to feeds: how many at once, how long a result is trusted and how retries back off.
 */
export const RESOLVE_LIMITS = {
  /** Packages resolved at the same time, each making one request at a time. */
  concurrentPackages: 2,
  /** How long a cached mapping, negative ones included, is used without asking again. */
  ttlMs: 7 * 24 * 60 * 60_000,
  /** Retries of one request after a 429 or 5xx answer. */
  retries: 3,
  /** The wait before the first retry, doubled before each next one. */
  backoffMs: 1000,
} as const
