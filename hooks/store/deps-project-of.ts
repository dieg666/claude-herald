import type { DepsProject } from '../../types/index.js'
import { dependencyOf } from './dependency-of.js'
import { depsSettingsOf } from './deps-settings-of.js'
import { isRecord } from './is-record.js'
import { pageHashesOf } from './page-hashes-of.js'

/**
 * A stored project record, settings completed with the defaults and entries that are not a dependency or a hash dropped; an empty record when it is not one.
 *
 * @param value one project's stored record
 */
export function depsProjectOf(value: unknown): DepsProject {
  const stored = isRecord(value) ? value : {}
  const { detectedCount } = stored

  return {
    settings: depsSettingsOf(stored.settings),
    dependencies: Array.isArray(stored.dependencies)
      ? stored.dependencies.flatMap(entry => {
          const dependency = dependencyOf(entry)

          return dependency === undefined ? [] : [dependency]
        })
      : [],
    detectedCount:
      typeof detectedCount === 'number' && Number.isInteger(detectedCount) && detectedCount >= 0
        ? detectedCount
        : 0,
    manifestHashes: pageHashesOf(stored.manifestHashes),
  }
}
