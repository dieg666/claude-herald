import type { Dependency, ReleaseFlags } from '../../../types/index.js'
import type { ReleaseLevel } from './release-level.js'

/**
 * One release of a followed dependency newer than the version in use, or not comparable with it.
 */
export type ClassifiedRelease = {
  /** `<ecosystem>:<name>|<entry guid, link or title>`: what the model's flags are cached under. */
  readonly id: string
  readonly dependency: Dependency
  /** The version the release names, as written; absent when it names none. */
  readonly version?: string
  /** The version it is compared against: the one in use, else the floor of the declared range. */
  readonly current?: string
  readonly level: ReleaseLevel
  /** Whether the version is a pre-release (dev, alpha, beta, milestone, rc, snapshot). */
  readonly isPrerelease: boolean
  readonly title: string
  readonly url?: string
  readonly publishedAt?: string
  /** The release notes as one line of plain text, possibly empty. */
  readonly notes: string
  /** From keywords in the title and notes, and once checked, from the model's reading of the notes. */
  readonly flags: ReleaseFlags
}
