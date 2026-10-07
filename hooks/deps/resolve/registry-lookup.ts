import type { Dependency } from '../../../types/index.js'
import type { Get } from './get.js'
import type { Lookup } from './lookup.js'

/**
 * Finds a package's repository from its registry's metadata; never rejects.
 */
export type RegistryLookup = (get: Get, dependency: Dependency) => Promise<Lookup>
