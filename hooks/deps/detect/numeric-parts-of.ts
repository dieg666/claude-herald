/**
 * The leading numeric parts of a version (`1.2.3-beta` gives [1, 2, 3]).
 *
 * @param version a version or a requirement's version part
 */
export function numericPartsOf(version: string): number[] {
  const match = /\d+(?:\.\d+)*/.exec(version)

  return match === null ? [] : match[0].split('.').map(Number)
}
