import { isRecord } from '../../store/is-record.js'
import { parseYaml } from './parse-yaml.js'
import { recordAt } from './record-at.js'

/**
 * A resolved pnpm version without its peer suffix or the aliased package's name; undefined for a link, a local path or anything else that is not a version.
 *
 * @param value the importer entry: a version string, or `{ specifier, version }`
 */
function versionOf(value: unknown): string | undefined {
  const raw = isRecord(value) ? value.version : value

  if (typeof raw !== 'string' || /^(?:link|file):/.test(raw)) {
    return undefined
  }

  const version = raw.replace(/\(.*$/, '').trim()
  // An alias resolves to `name@1.0.0` (v9), `/name@1.0.0` (v6) or `/name/1.0.0` (v5).
  const unaliased = /^\d/.test(version)
    ? version
    : version.replace(/^\/?(?:@[^/@]+\/)?[^/@]+[@/]/, '')
  const bare = unaliased.replace(/_.*$/, '')

  return /^\d/.test(bare) ? bare : undefined
}

/**
 * Reads a pnpm-lock.yaml (v5 to v9, several documents allowed) and answers the version installed for a package of one importer; throws when the file is not readable YAML.
 *
 * @param text the lockfile
 * @returns the lookup: the importer (`.` for the lockfile's own package, else the member's directory relative to it) and the package name
 */
export function pnpmLockVersionsOf(
  text: string,
): (importer: string, name: string) => string | undefined {
  const documents = parseYaml(text)

  if (!documents.some(isRecord)) {
    throw new Error('not a pnpm lockfile')
  }

  return (importer, name) => {
    for (const document of documents) {
      const importers = recordAt(document, 'importers')
      const own = Object.hasOwn(importers, importer)
        ? recordAt(importers, importer)
        : importer === '.' && Object.keys(importers).length === 0
          ? recordAt(document)
          : {}

      for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
        const entries = recordAt(own, section)
        const version = Object.hasOwn(entries, name) ? versionOf(entries[name]) : undefined

        if (version !== undefined) {
          return version
        }
      }
    }

    return undefined
  }
}
