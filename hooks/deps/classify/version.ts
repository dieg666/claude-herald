/**
 * A parsed version, in a form every supported scheme compares in.
 */
export type Version = {
  /** The PEP 440 epoch (`N!`), 0 when absent. */
  readonly epoch: number
  /** The numeric release parts, at least one (`[1, 2, 3]`, `[2025, 11, 25]`). */
  readonly release: readonly number[]
  /** What follows the release, in order: numbers, and lowercased words with their rank (below 0 before the final release, above 0 after it); empty for a final release. */
  readonly qualifiers: readonly (number | { readonly word: string; readonly rank: number })[]
}
