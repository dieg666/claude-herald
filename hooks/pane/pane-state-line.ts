/**
 * A tab's one dim state line: what happened and what changes it, and the part kept whole when the line is cut.
 */
export type PaneStateLine = {
  /** What happened and what changes it. */
  readonly text: string
  /** Drawn after `text` and kept whole when the line is cut: when the source last refreshed. */
  readonly tail?: string
}
