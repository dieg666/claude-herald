/**
 * Bounds on following the stack's releases: how much one refresh reads and asks, and how much the store keeps.
 */
export const STACK_LIMITS = {
  /** Packages looked up in their registry per refresh, the rest waiting for a later one. */
  lookupsPerRun: 10,
  /** Release feeds read per refresh, the least recently read first. */
  feedsPerRun: 10,
  /** Release feeds read at the same time. */
  concurrentFeeds: 2,
  /** How long a release feed is trusted before it is read again, unless the version in use changed. */
  recheckMs: 60 * 60_000,
  /** How long a package whose lookup or feed failed is left alone before it is tried again. */
  failureWindowMs: 60 * 60_000,
  /** Releases kept per package, newest first. */
  itemsPerDep: 5,
  /** Releases kept per project across its packages, newest first. */
  itemsPerProject: 100,
  /** Release ids remembered per package, newest first; a release feed holds ten entries. */
  seenPerDep: 10,
  /** Characters of the release notes kept with each release. */
  textChars: 1000,
} as const
