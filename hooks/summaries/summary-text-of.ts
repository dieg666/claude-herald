import type { Item } from '../../types/index.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { cutTo } from '../page/cut-to.js'
import { excerptOf } from './excerpt-of.js'
import { SUMMARY_LIMITS } from './summary-limits.js'

/**
 * The text a summary of an item is written from: its excerpt without boilerplate, cut to the limit; empty when the item has no usable text, which gets no summary at all.
 *
 * @param item the item
 */
export function summaryTextOf(item: Pick<Item, 'title' | 'text'>): string {
  return excerptOf(item.text, cutTo(collapsedTextOf(item.title).trim(), SUMMARY_LIMITS.titleChars))
}
