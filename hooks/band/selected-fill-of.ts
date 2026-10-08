/**
 * The Box props that fill a row as the selected one, gaps and padding included: the theme's text color as the background, nothing on any other row.
 *
 * @param isSelected whether the row is the selected one
 */
export function selectedFillOf(isSelected: boolean): { readonly backgroundColor?: 'text' } {
  return isSelected ? { backgroundColor: 'text' } : {}
}
