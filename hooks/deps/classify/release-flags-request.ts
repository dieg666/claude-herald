/**
 * What to send the model to flag one release.
 */
export type ReleaseFlagsRequest = {
  /** The standing instructions, which never contain release content. */
  system: string
  /** The request, which carries the release as data. */
  prompt: string
}
