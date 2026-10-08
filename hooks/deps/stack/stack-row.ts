import type { StackItem } from '../../../types/index.js'
import type { StackPackage } from './stack-package.js'

/**
 * One row of the pane's stack tab: a package, or one of its releases listed under it while it is expanded.
 */
export type StackRow =
  | { readonly kind: 'package'; readonly pkg: StackPackage }
  | { readonly kind: 'release'; readonly pkg: StackPackage; readonly item: StackItem }
