import { recordAt } from '../detect/record-at.js'
import { lookupJson } from './lookup-json.js'
import { pathSegmentOf } from './path-segment-of.js'
import type { RegistryLookup } from './registry-lookup.js'
import { repoLookupOf } from './repo-lookup-of.js'

/**
 * Rust: the crate's `repository`, then `homepage`, from the crates.io API (which wants the descriptive User-Agent every request sends).
 */
export const cargoLookup: RegistryLookup = (get, dependency) => {
  const name = pathSegmentOf(dependency.name, /^[\w-]+$/)

  if (name === undefined) {
    return Promise.resolve({ kind: 'none', reason: 'not a valid cargo name' })
  }

  return lookupJson(get, `https://crates.io/api/v1/crates/${name}`, json => {
    const crate = recordAt(json, 'crate')

    return repoLookupOf([crate.repository, crate.homepage])
  })
}
