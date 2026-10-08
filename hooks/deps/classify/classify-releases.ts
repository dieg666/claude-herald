import type { Dependency } from '../../../types/index.js'
import type { ParsedEntry } from '../../feed/parsed-entry.js'
import { depFeedKeyOf } from '../resolve/dep-feed-key-of.js'
import type { ClassifiedRelease } from './classified-release.js'
import { compareVersions } from './compare-versions.js'
import { currentVersionOf } from './current-version-of.js'
import { keywordFlagsOf } from './keyword-flags-of.js'
import { levelOf } from './level-of.js'
import { namesDependency } from './names-dependency.js'
import { parseVersion } from './parse-version.js'
import { tagOfEntry } from './tag-of-entry.js'
import { taggedVersionOf } from './tagged-version-of.js'
import type { Version } from './version.js'

/**
 * Whether a version comes before its final release: a qualifier that ranks below it, or semver's leading numeric one.
 *
 * @param version the parsed version
 */
function isPrereleaseOf(version: Version): boolean {
  return version.qualifiers.some((qualifier, index) =>
    typeof qualifier === 'number' ? index === 0 : qualifier.rank < 0,
  )
}

/**
 * A dependency's release feed entries classified against the version in use: the version each names (from the GitHub tag, else the title), how far it is (patch, minor, major) and its keyword flags. Releases at or below the version in use are left out, and so are entries whose tag names another package of a monorepo; a release or a version in use that cannot be compared stays, as `unknown`. Pure: no model call.
 *
 * @param dependency the followed dependency
 * @param entries its release feed's entries, in feed order
 * @returns the releases to show, in feed order
 */
export function classifyReleases(
  dependency: Dependency,
  entries: readonly ParsedEntry[],
): ClassifiedRelease[] {
  const current = currentVersionOf(dependency)
  const base = current === undefined ? undefined : parseVersion(current, dependency.ecosystem)

  return entries.flatMap(entry => {
    const tag = tagOfEntry(entry)
    const tagged =
      (tag === undefined ? undefined : taggedVersionOf(tag)) ?? taggedVersionOf(entry.title, true)

    if (tagged?.package !== undefined && !namesDependency(tagged.package, dependency)) {
      return []
    }

    const version =
      tagged === undefined ? undefined : parseVersion(tagged.version, dependency.ecosystem)

    if (base !== undefined && version !== undefined && compareVersions(version, base) <= 0) {
      return []
    }

    const notes = entry.summary ?? ''
    const release: ClassifiedRelease = {
      id: `${depFeedKeyOf(dependency)}|${entry.guid ?? entry.link ?? entry.title}`,
      dependency,
      ...(tagged === undefined ? {} : { version: tagged.version }),
      ...(current === undefined ? {} : { current }),
      level: base === undefined || version === undefined ? 'unknown' : levelOf(base, version),
      isPrerelease: version !== undefined && isPrereleaseOf(version),
      title: entry.title,
      ...(entry.link === undefined ? {} : { url: entry.link }),
      ...(entry.publishedAt === undefined ? {} : { publishedAt: entry.publishedAt }),
      notes,
      flags: keywordFlagsOf(`${entry.title}\n${notes}`),
    }

    return [release]
  })
}
