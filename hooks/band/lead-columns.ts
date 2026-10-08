import { MARK_COLUMNS } from './mark-columns.js'
import { SOURCE_COLUMNS } from './source-columns.js'
import { SOURCE_GAP_COLUMNS } from './source-gap-columns.js'

/**
 * Cells before a full band row's headline and summary: the selection mark and a space, the source column and its gap, so every headline and summary starts in one column.
 */
export const LEAD_COLUMNS = MARK_COLUMNS + SOURCE_COLUMNS + SOURCE_GAP_COLUMNS
