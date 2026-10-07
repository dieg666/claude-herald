/**
 * Where a detection walks from and how deep.
 */
export type ProjectRoot = {
  /** The directory the stack is detected from and stored under, absolute. */
  path: string
  /** How many directory levels below it are listed. */
  maxDepth: number
}
