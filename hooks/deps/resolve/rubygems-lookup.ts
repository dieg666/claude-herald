import { lookupJson } from './lookup-json.js'
import { pathSegmentOf } from './path-segment-of.js'
import type { RegistryLookup } from './registry-lookup.js'
import { repoLookupOf } from './repo-lookup-of.js'

/**
 * Ruby: the gem's `source_code_uri`, then `homepage_uri`, from the rubygems.org API.
 */
export const rubygemsLookup: RegistryLookup = (get, dependency) => {
  const name = pathSegmentOf(dependency.name)

  if (name === undefined) {
    return Promise.resolve({ kind: 'none', reason: 'not a valid rubygems name' })
  }

  return lookupJson(get, `https://rubygems.org/api/v1/gems/${name}.json`, json =>
    repoLookupOf([json.source_code_uri, json.homepage_uri]),
  )
}
