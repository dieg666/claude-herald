/**
 * The parent of an absolute directory, or undefined at a filesystem root (`/`, `C:\`).
 *
 * @param dir an absolute path, `/` or `\` separated
 */
export function parentDirOf(dir: string): string | undefined {
  const trimmed = dir.length > 1 ? dir.replace(/[\\/]+$/, '') : dir
  const cut = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))

  if (cut < 0 || /^[A-Za-z]:$/.test(trimmed) || trimmed === '' || trimmed === '/') {
    return undefined
  }

  const parent = trimmed.slice(0, cut)

  if (parent === '') {
    return trimmed[0]
  }

  return /^[A-Za-z]:$/.test(parent) ? `${parent}${trimmed[cut]}` : parent
}
