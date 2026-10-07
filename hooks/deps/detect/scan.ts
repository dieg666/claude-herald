import type { Dependency } from '../../../types/index.js'

/**
 * What one scan of a project found: every declared dependency (duplicates included) and the text of every file read.
 */
export type Scan = {
  dependencies: Dependency[]
  /** Each manifest, lockfile and workspace file read, by path relative to the root. */
  texts: ReadonlyMap<string, string>
}
