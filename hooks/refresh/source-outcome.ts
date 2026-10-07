import type { Item } from '../../types/index.js'

/**
 * What refreshing one source did: the items it had not seen before, and why it failed when it did.
 */
export type SourceOutcome = {
  readonly newItems: Item[]
  readonly error?: string
}
