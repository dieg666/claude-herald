import type { Item } from '../../types/index.js'

/**
 * What one refresh run did: skipped because another was in flight, the items new to it across the sources on the band or in the pane (newest first; a source hidden from both gives none, so it raises no toast and asks for no summary), and the failures by source id.
 */
export type RefreshRun = {
  readonly isSkipped: boolean
  readonly newItems: Item[]
  readonly errors: Record<string, string>
}
