import type { StackItem } from '../../../types/index.js'
import type { StackRow } from './stack-row.js'

/**
 * The release a stack tab row acts on: a package's target, or the release the row lists.
 *
 * @param row the row
 */
export function stackRowItemOf(row: StackRow): StackItem {
  return row.kind === 'package' ? row.pkg.target : row.item
}
