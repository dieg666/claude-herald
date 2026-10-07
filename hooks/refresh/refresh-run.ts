import type { Item } from '../../types/index.js'

/**
 * What one refresh run did: skipped because another was in flight, the items new to it across sources (newest first), and the failures by source id.
 */
export type RefreshRun = {
  readonly isSkipped: boolean
  readonly newItems: Item[]
  readonly errors: Record<string, string>
}
