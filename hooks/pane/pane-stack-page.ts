import type { StackPackage } from '../deps/stack/stack-package.js'
import type { StackRow } from '../deps/stack/stack-row.js'

/**
 * What the stack tab's page holds besides its items: the packages listed, a row per item, the rows in the window, the packages expanded and the summary line.
 */
export type PaneStackPage = {
  /** Every package the tab lists, after the filter, in order. */
  readonly packages: readonly StackPackage[]
  /** One per item of the page, in the same order: what each row draws. */
  readonly rows: readonly StackRow[]
  /** The rows inside the window. */
  readonly shownRows: readonly StackRow[]
  /** The keys of the packages expanded. */
  readonly expanded: readonly string[]
  /** The line under the heading, counted over every package at the show level, before the filter; empty for none. */
  readonly summary: string
}
