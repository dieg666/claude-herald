import type { ReleaseFlagsEntry } from '../../../types/index.js'
import type { ClassifiedRelease } from '../classify/classified-release.js'
import { hasAdvisoryId } from '../classify/has-advisory-id.js'

/**
 * Releases with the model's cached verdicts applied, as `flagReleases` applies them, without asking the model: the verdict replaces the keyword flags, an advisory id always sets security; a release without a verdict keeps its keyword flags.
 *
 * @param releases the classified releases
 * @param entries the cached verdicts
 */
export function withCachedFlags(
  releases: readonly ClassifiedRelease[],
  entries: readonly ReleaseFlagsEntry[],
): ClassifiedRelease[] {
  const verdicts = new Map(
    entries.filter(entry => entry.malformed === undefined).map(entry => [entry.releaseId, entry]),
  )

  return releases.map(release => {
    const verdict = verdicts.get(release.id)

    return verdict === undefined
      ? release
      : {
          ...release,
          flags: {
            breaking: verdict.breaking,
            security: verdict.security || hasAdvisoryId(`${release.title}\n${release.notes}`),
          },
        }
  })
}
