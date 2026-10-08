/**
 * A typed level among those allowed, ignoring case and spaces (`Minor +` reads `minor+`); undefined for any other text.
 *
 * @param text what the person typed
 * @param levels the levels allowed
 */
export function depsLevelOf<T extends string>(text: string, levels: readonly T[]): T | undefined {
  const wanted = text.replace(/\s+/g, '').toLowerCase()

  return levels.find(level => level === wanted)
}
