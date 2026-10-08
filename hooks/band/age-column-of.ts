import { AGE_COLUMNS } from './age-columns.js'
import { displayWidthOf } from './display-width-of.js'

/**
 * An age right-aligned in the `AGE_COLUMNS` cells of its column; blank for an item without one.
 *
 * @param age the age as `ageOf` says it, undefined for none
 */
export function ageColumnOf(age: string | undefined): string {
  const text = age ?? ''

  return ' '.repeat(Math.max(0, AGE_COLUMNS - displayWidthOf(text))) + text
}
