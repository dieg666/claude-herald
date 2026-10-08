import type { StackItem } from '../../../types/index.js'
import type { ClassifiedRelease } from '../classify/classified-release.js'

/**
 * A stack item as the classified release the model's flag check reads: its package, versions, title, kept notes and flags.
 *
 * @param item the stack item
 */
export function releaseOfStackItem(item: StackItem): ClassifiedRelease {
  const { release } = item

  return {
    id: release.releaseId,
    dependency: {
      ecosystem: release.ecosystem,
      name: release.name,
      isDev: false,
      isRoot: true,
      manifestPath: '',
    },
    ...(release.version === undefined ? {} : { version: release.version }),
    ...(release.current === undefined ? {} : { current: release.current }),
    level: release.level,
    isPrerelease: release.isPrerelease,
    title: item.title,
    url: item.url,
    ...(item.publishedAt === undefined ? {} : { publishedAt: item.publishedAt }),
    notes: item.text,
    flags: { breaking: release.breaking, security: release.security },
  }
}
