import { recordAt } from '../detect/record-at.js'
import { lookupJson } from './lookup-json.js'
import type { RegistryLookup } from './registry-lookup.js'
import { repoLookupOf } from './repo-lookup-of.js'

/**
 * Rust: the crate's `repository`, then `homepage`, from the crates.io API (which wants the descriptive User-Agent every request sends).
 */
export const cargoLookup: RegistryLookup = (get, dependency) => {
  if (!/^[\w-]+$/.test(dependency.name)) {
    return Promise.resolve({ kind: 'none', reason: 'not a crate name' })
  }

  return lookupJson(get, `https://crates.io/api/v1/crates/${dependency.name}`, json => {
    const crate = recordAt(json, 'crate')

    return repoLookupOf([crate.repository, crate.homepage])
  })
}
