import { recordAt } from '../detect/record-at.js'
import { lookupJson } from './lookup-json.js'
import type { RegistryLookup } from './registry-lookup.js'
import { repoLookupOf } from './repo-lookup-of.js'
import { shorthandRepoOf } from './shorthand-repo-of.js'

/**
 * npm: the latest version's `repository` (an object's `url`, a URL or a `github:`/`owner/repo` shorthand), then `homepage`, from registry.npmjs.org; a scoped name's `/` is encoded.
 */
export const npmLookup: RegistryLookup = (get, dependency) => {
  const { name } = dependency

  if (!/^(?:@[\w.~-]+\/)?[\w.~-]+$/.test(name)) {
    return Promise.resolve({ kind: 'none', reason: 'not an npm package name' })
  }

  const path = name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : name

  return lookupJson(get, `https://registry.npmjs.org/${path}/latest`, json => {
    const repository = json.repository

    return repoLookupOf(
      [
        typeof repository === 'string' ? repository : recordAt(json, 'repository').url,
        json.homepage,
      ],
      shorthandRepoOf,
    )
  })
}
