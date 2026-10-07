import type { Item } from '../../types/index.js'

/**
 * What reading one source yielded: its items (with the page hash they were extracted from), no change since the last extraction, or why it failed.
 */
export type Fetched =
  | { readonly kind: 'items'; readonly items: Item[]; readonly pageHash?: string }
  | { readonly kind: 'unchanged' }
  | { readonly kind: 'failed'; readonly reason: string }
