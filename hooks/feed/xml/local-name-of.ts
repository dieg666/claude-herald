/** A qualified name without its namespace prefix (`dc:date` reads `date`). */
export function localNameOf(name: string): string {
  return name.slice(name.indexOf(':') + 1)
}
