/**
 * A package name as one URL path segment, percent-encoded, or undefined when it has a character the pattern does not allow or is nothing but dots (a `.` or `..` segment would climb the path).
 *
 * @param text the name, or one part of it
 * @param allowed what the registry accepts in the name
 */
export function pathSegmentOf(text: string, allowed = /^[\w.-]+$/): string | undefined {
  return allowed.test(text) && !/^\.+$/.test(text) ? encodeURIComponent(text) : undefined
}
