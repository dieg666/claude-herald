/**
 * A new version split where it starts to differ from the version in use, by dot-separated parts, a leading `v` on either side ignored: `7.1.0` to `7.3.1` gives `7.` and `3.1`; without a version in use, or when the new one is shorter and equal so far, all of it changed.
 *
 * @param current the version in use, one line
 * @param version the new version, one line
 */
export function versionChangeOf(
  current: string | undefined,
  version: string,
): { readonly same: string; readonly changed: string } {
  if (current === undefined) {
    return { same: '', changed: version }
  }

  const prefix = /^v(?=\d)/i.exec(version)?.[0] ?? ''
  const before = current.replace(/^v(?=\d)/i, '').split('.')
  const after = version.slice(prefix.length).split('.')
  const index = after.findIndex((part, at) => part !== before[at])

  if (index === -1) {
    return after.length === before.length
      ? { same: version, changed: '' }
      : { same: '', changed: version }
  }

  const same = after.slice(0, index).join('.')

  return {
    same: index === 0 ? prefix : `${prefix}${same}.`,
    changed: after.slice(index).join('.'),
  }
}
