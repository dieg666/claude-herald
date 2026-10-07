import type { Dependency } from '../../../types/index.js'
import type { Get } from './get.js'
import type { Lookup } from './lookup.js'
import { REGISTRY_LOOKUPS } from './registry-lookups.js'
import { shorthandRepoOf } from './shorthand-repo-of.js'

/**
 * Where a dependency's code lives: its manifest's GitHub source URL when it names one, else its registry's metadata. Never rejects.
 *
 * @param get the gentle fetch
 * @param dependency the package
 */
export async function repoOfDependency(get: Get, dependency: Dependency): Promise<Lookup> {
  const fromSource =
    dependency.source === undefined ? undefined : shorthandRepoOf(dependency.source)

  if (fromSource !== undefined) {
    return { kind: 'repo', repo: fromSource }
  }

  const lookup = REGISTRY_LOOKUPS[dependency.ecosystem]

  if (lookup === undefined) {
    return {
      kind: 'none',
      reason:
        dependency.source === undefined
          ? `no registry lookup for ${dependency.ecosystem}`
          : `repository not on GitHub: ${dependency.source}`,
    }
  }

  try {
    return await lookup(get, dependency)
  } catch (error) {
    return { kind: 'failed', reason: error instanceof Error ? error.message : String(error) }
  }
}
