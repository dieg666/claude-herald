import type { SummaryKind } from '../../types/index.js'

/**
 * The replies the model gave for one item, language and kind that described the item instead of the story, for this load of the module.
 */
export type Rejection = {
  readonly itemId: string
  readonly lang: string
  readonly kind: SummaryKind
  /** How many replies were rejected. */
  readonly count: number
  /** When the last one was, in ms since the epoch. */
  readonly at: number
}
