import { xmlAttributeOf } from '../detect/xml-attribute-of.js'
import { xmlChildOf } from '../detect/xml-child-of.js'
import { lookupJson } from './lookup-json.js'
import { lookupVersioned } from './lookup-versioned.js'
import { plainVersionOf } from './plain-version-of.js'
import type { RegistryLookup } from './registry-lookup.js'
import { repoLookupOf } from './repo-lookup-of.js'

/**
 * .NET: the package's `<repository url>`, then `<projectUrl>`, from its nuspec on api.nuget.org's flat container, for the version in use or else the newest stable one its version list names.
 */
export const nugetLookup: RegistryLookup = (get, dependency) => {
  const id = dependency.name.toLowerCase()

  if (!/^[\w.-]+$/.test(id)) {
    return Promise.resolve({ kind: 'none', reason: 'not a NuGet package id' })
  }

  const base = `https://api.nuget.org/v3-flatcontainer/${id}`

  return lookupVersioned(
    get,
    plainVersionOf(dependency.versionInUse)?.toLowerCase(),
    () =>
      lookupJson(get, `${base}/index.json`, json => {
        const versions = Array.isArray(json.versions)
          ? json.versions.flatMap(version => {
              const plain = typeof version === 'string' ? plainVersionOf(version) : undefined

              return plain === undefined ? [] : [plain.toLowerCase()]
            })
          : []
        const version = versions.filter(entry => !entry.includes('-')).at(-1) ?? versions.at(-1)

        return version === undefined
          ? ({ kind: 'none', reason: 'no versions in the registry' } as const)
          : ({ kind: 'version', version } as const)
      }),
    version => `${base}/${version}/${id}.nuspec`,
    nuspec => {
      const repository = /<repository\b([^>]*)>/i.exec(nuspec)?.[1]

      return repoLookupOf([
        repository === undefined ? undefined : xmlAttributeOf(repository, 'url'),
        xmlChildOf(nuspec, 'projectUrl'),
      ])
    },
  )
}
