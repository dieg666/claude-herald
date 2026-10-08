/**
 * A new version split where it starts to differ from the version in use, by dot-separated parts: `7.1.0` to `7.3.1` gives `7.` and `3.1`; without a version in use all of it changed.
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

  const before = current.split('.')
  const after = version.split('.')
  const index = after.findIndex((part, at) => part !== before[at])

  if (index === -1) {
    return { same: version, changed: '' }
  }

  const same = after.slice(0, index).join('.')

  return { same: index === 0 ? '' : `${same}.`, changed: after.slice(index).join('.') }
}
