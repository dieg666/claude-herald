/**
 * The rows the pane's tree takes at least, so its footer sits at the bottom: the body's rows where the pane is docked and keeps its height; none inline, where the frame fits the tree, or when the rows are not a number.
 *
 * @param placement where the surface seated the pane
 * @param bodyRows the rows the body has
 */
export function paneFillRowsOf(placement: 'dock' | 'inline', bodyRows: number): number | undefined {
  return placement === 'dock' && Number.isFinite(bodyRows) && bodyRows > 0
    ? Math.floor(bodyRows)
    : undefined
}
