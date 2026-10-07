import { lookupJson } from './lookup-json.js'
import type { RegistryLookup } from './registry-lookup.js'
import { repoLookupOf } from './repo-lookup-of.js'

/**
 * Ruby: the gem's `source_code_uri`, then `homepage_uri`, from the rubygems.org API.
 */
export const rubygemsLookup: RegistryLookup = (get, dependency) => {
  if (!/^[\w.-]+$/.test(dependency.name)) {
    return Promise.resolve({ kind: 'none', reason: 'not a gem name' })
  }

  return lookupJson(get, `https://rubygems.org/api/v1/gems/${dependency.name}.json`, json =>
    repoLookupOf([json.source_code_uri, json.homepage_uri]),
  )
}
