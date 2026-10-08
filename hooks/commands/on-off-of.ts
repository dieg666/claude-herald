/**
 * A typed `on` (true) or `off` (false), any case; undefined for anything else.
 *
 * @param text what the person typed
 */
export function onOffOf(text: string): boolean | undefined {
  const word = text.trim().toLowerCase()

  return word === 'on' ? true : word === 'off' ? false : undefined
}
