import { isRecord } from '../../store/is-record.js'
import { recordAt } from '../detect/record-at.js'
import { lookupJson } from './lookup-json.js'
import { pathSegmentOf } from './path-segment-of.js'
import type { RegistryLookup } from './registry-lookup.js'
import { repoLookupOf } from './repo-lookup-of.js'

/**
 * PHP: the newest version's `source.url`, then `homepage`, from Packagist's `p2` metadata (whose first version carries every field).
 */
export const packagistLookup: RegistryLookup = (get, dependency) => {
  const name = dependency.name.toLowerCase()

  const parts = name.split('/').map(part => pathSegmentOf(part))

  if (parts.length !== 2 || parts.includes(undefined)) {
    return Promise.resolve({ kind: 'none', reason: 'not a valid packagist name' })
  }

  return lookupJson(get, `https://repo.packagist.org/p2/${parts.join('/')}.json`, json => {
    const versions = recordAt(json, 'packages')[name]
    const newest = Array.isArray(versions) && isRecord(versions[0]) ? versions[0] : {}

    return repoLookupOf([recordAt(newest, 'source').url, newest.homepage])
  })
}
