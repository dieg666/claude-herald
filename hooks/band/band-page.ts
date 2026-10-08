import type { Item } from '../../types/index.js'
import type { BandSpan } from './band-span.js'

/**
 * What the band shows now: the page's items, where they sit in the whole list, and whether rotation is paused.
 */
export type BandPage = {
  readonly items: readonly Item[]
  readonly span: BandSpan
  readonly total: number
  readonly isPaused: boolean
}
