import { jsonRecordOf } from './json-record-of.js'
import { recordAt } from './record-at.js'

/**
 * A lock entry's version, unless it is a link or a local path.
 *
 * @param entry one lock entry
 */
function versionOf(entry: Record<string, unknown>): string | undefined {
  const { version } = entry

  return typeof version === 'string' && entry.link !== true && !/^(?:file|link):/.test(version)
    ? version
    : undefined
}

/**
 * Reads a package-lock.json or npm-shrinkwrap.json (v1 to v3) and answers the version installed for a package of one workspace member; throws when the file is not JSON.
 *
 * @param text the lockfile
 * @returns the lookup: the member's directory relative to the lockfile (`''` for its own package) and the package name
 */
export function npmLockVersionsOf(
  text: string,
): (memberDir: string, name: string) => string | undefined {
  const lock = jsonRecordOf(text)
  const packages = recordAt(lock, 'packages')
  const legacy = recordAt(lock, 'dependencies')

  return (memberDir, name) => {
    const own = memberDir === '' ? undefined : `${memberDir}/node_modules/${name}`
    const keys = [own, `node_modules/${name}`].filter(key => key !== undefined)
    const found = keys.map(key => versionOf(recordAt(packages, key))).find(Boolean)

    return found ?? (memberDir === '' ? versionOf(recordAt(legacy, name)) : undefined)
  }
}
