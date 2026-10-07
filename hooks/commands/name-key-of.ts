/**
 * What two names of the same source share: lowercased, whitespace collapsed.
 *
 * @param name a source name
 */
export function nameKeyOf(name: string): string {
  return name.replace(/\s+/g, ' ').trim().toLowerCase()
}
