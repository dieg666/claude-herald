/**
 * A yarn.lock text without the quotes around it.
 *
 * @param text a descriptor or value as written
 */
function unquoted(text: string): string {
  const trimmed = text.trim()

  return trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1) : trimmed
}

/**
 * The package name a descriptor such as `@scope/pkg@npm:^1.0.0` is for.
 *
 * @param descriptor one descriptor of an entry's header
 */
function nameOf(descriptor: string): string {
  const at = descriptor.indexOf('@', 1)

  return at < 0 ? descriptor : descriptor.slice(0, at)
}

/**
 * Reads a yarn.lock (classic v1 or Berry) and answers the version installed for a package and the range a manifest asked for; throws when no entry can be read. Falls back to the only version locked for that name when no descriptor matches the range.
 *
 * @param text the lockfile
 * @returns the lookup: the package name and its range as the manifest writes it
 */
export function yarnLockVersionsOf(
  text: string,
): (name: string, range: string) => string | undefined {
  const byDescriptor = new Map<string, string>()
  const byName = new Map<string, Set<string>>()
  let descriptors: string[] = []

  for (const line of text.split(/\r?\n/)) {
    if (/^[^\s#].*:$/.test(line)) {
      descriptors = line.slice(0, -1).split(/,\s*/).map(unquoted)
    } else if (/^ {2}version:? /.test(line)) {
      const version = unquoted(line.replace(/^ {2}version:?\s+/, ''))

      for (const descriptor of descriptors) {
        byDescriptor.set(descriptor, version)
        byName.set(nameOf(descriptor), (byName.get(nameOf(descriptor)) ?? new Set()).add(version))
      }
    }
  }

  if (byDescriptor.size === 0) {
    throw new Error('no yarn.lock entries')
  }

  return (name, range) => {
    const exact = byDescriptor.get(`${name}@${range}`) ?? byDescriptor.get(`${name}@npm:${range}`)
    const versions = [...(byName.get(name) ?? [])]

    return exact ?? (versions.length === 1 ? versions[0] : undefined)
  }
}
