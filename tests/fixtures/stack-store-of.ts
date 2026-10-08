import type { DepsSettings, StackItem } from '../../types/index.js'

/**
 * What the store holds for a project at `/repo` that follows the packages of these stack items and keeps them as its releases, with those stack settings; `stackTreeOf` is the project that declares them.
 *
 * @param items the stack items kept
 * @param settings the project's stack settings
 */
export function stackStoreOf(items: readonly StackItem[], settings: Partial<DepsSettings> = {}) {
  const keys = [...new Set(items.map(item => `${item.release.ecosystem}:${item.release.name}`))]

  return {
    deps: {
      '/repo': {
        settings,
        dependencies: items.map(item => ({
          ecosystem: item.release.ecosystem,
          name: item.release.name,
          versionInUse: item.release.current,
          isDev: false,
          isRoot: true,
          manifestPath: item.release.ecosystem === 'pypi' ? 'requirements.txt' : 'package.json',
        })),
        detectedCount: keys.length,
        manifestHashes: {},
        detectedAt: 1,
      },
    },
    stack: {
      '/repo': {
        deps: Object.fromEntries(
          keys.map(key => [
            key,
            {
              checkedAt: 1,
              seen: [],
              items: items.filter(item => `${item.release.ecosystem}:${item.release.name}` === key),
            },
          ]),
        ),
        refreshedAt: 1,
      },
    },
  }
}
