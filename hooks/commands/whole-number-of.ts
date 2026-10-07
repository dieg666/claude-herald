/**
 * A typed whole number within bounds, or undefined.
 *
 * @param text what the person typed
 * @param min the smallest allowed
 * @param max the largest allowed
 */
export function wholeNumberOf(text: string, min: number, max: number): number | undefined {
  if (!/^\d{1,9}$/.test(text)) {
    return undefined
  }

  const value = Number(text)

  return value >= min && value <= max ? value : undefined
}
