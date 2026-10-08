/**
 * The Text props that draw a row as the selected one: the theme's inverse text color over the row's fill, nothing on any other row.
 *
 * @param isSelected whether the row is the selected one
 */
export function selectedStyleOf(isSelected: boolean): { readonly color?: 'inverseText' } {
  return isSelected ? { color: 'inverseText' } : {}
}
