/**
 * What a release tag or title says: the version, and the package it names when it names one (`pkg@1.2.3`, `sdk/v1.2.3`, `tokio-macros-2.2.0`).
 */
export type TaggedVersion = {
  /** The version as written, `v` prefix included. */
  readonly version: string
  /** The package, module path or directory the tag is for. */
  readonly package?: string
}
