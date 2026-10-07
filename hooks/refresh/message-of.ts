/**
 * What was thrown as one short line for a status or debug line.
 *
 * @param error what was thrown
 */
export function messageOf(error: unknown): string {
  const text = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ').trim()

  return text.length > 200 ? `${text.slice(0, 199)}…` : text
}
