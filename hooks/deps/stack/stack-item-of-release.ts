import type { StackItem } from '../../../types/index.js'
import { STACK_TAB } from '../../names/stack-tab.js'
import { cutTo } from '../../page/cut-to.js'
import type { ClassifiedRelease } from '../classify/classified-release.js'
import { STACK_LIMITS } from './stack-limits.js'

/**
 * A version as shown: trimmed, without a `v` before its first digit.
 *
 * @param version the version as written
 */
function shownVersionOf(version: string): string {
  return version.trim().replace(/^v(?=\d)/i, '')
}

/**
 * A classified release as a stack item: its id under the stack, its title (else its version, else the package), its link (else the feed's releases page), its notes cut to `STACK_LIMITS.textChars`, its versions without a leading `v`.
 *
 * @param release the classified release
 * @param fallbackUrl where it is read when the entry has no link
 */
export function stackItemOfRelease(release: ClassifiedRelease, fallbackUrl: string): StackItem {
  const { dependency } = release

  return {
    id: `${STACK_TAB}:${release.id}`,
    sourceId: STACK_TAB,
    title: release.title.trim() || release.version || dependency.name,
    url: release.url ?? fallbackUrl,
    ...(release.publishedAt === undefined ? {} : { publishedAt: release.publishedAt }),
    text: cutTo(release.notes, STACK_LIMITS.textChars),
    release: {
      releaseId: release.id,
      ecosystem: dependency.ecosystem,
      name: dependency.name,
      ...(release.current === undefined ? {} : { current: shownVersionOf(release.current) }),
      ...(release.version === undefined ? {} : { version: shownVersionOf(release.version) }),
      level: release.level,
      isPrerelease: release.isPrerelease,
      breaking: release.flags.breaking,
      security: release.flags.security,
    },
  }
}
