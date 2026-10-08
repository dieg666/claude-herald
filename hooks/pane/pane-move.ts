/**
 * What changes the pane: a tab pressed (by its id), or the selection moving up or down.
 */
export type PaneMove = { readonly tab: string } | 'up' | 'down'
