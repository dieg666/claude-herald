/**
 * A workspace a manifest declares: its directory and the member patterns relative to it.
 */
export type Workspace = {
  /** The declaring manifest's directory, relative to the project root (`''` for the root). */
  dir: string
  /** Member patterns such as `crates/*` or `packages/app`; a `*` stays inside one directory, `**` spans several. */
  include: readonly string[]
  /** Patterns of directories to leave out. */
  exclude: readonly string[]
  /** The manifest file name every member directory holds. */
  manifest: string
}
