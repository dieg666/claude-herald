const VERSION =
  /^(?:release\s+)?(?:v\d+(?:\.\d+)*|\d+(?:\.\d+)+)(?:-[0-9a-z][0-9a-z.-]*)?(?:\+[0-9a-z.-]+)?$/i
const DATE = /^\d{4}-\d{2}-\d{2}(?:[ -](?:alpha|beta|rc|pre)[.-]?\d*)?$/i

/**
 * Whether a headline is only a version, the bare tag a release feed titles an entry with: `v1.2.3`, `1.12.0`, `1.0.0-rc.1`, `2026-07-28`, `2026-07-28 RC`, `Release 7.3.1`; a package's `@scope/pkg@1.2.3`, a word before the number (other than Release) or any other headline is not.
 *
 * @param title the item's headline
 */
export function isVersionOnly(title: string): boolean {
  const text = title.trim()

  return VERSION.test(text) || DATE.test(text)
}
