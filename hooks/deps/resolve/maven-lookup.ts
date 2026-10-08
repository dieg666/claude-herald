import { xmlChildOf } from '../detect/xml-child-of.js'
import { lookupVersioned } from './lookup-versioned.js'
import { pathSegmentOf } from './path-segment-of.js'
import { plainVersionOf } from './plain-version-of.js'
import type { RegistryLookup } from './registry-lookup.js'
import { repoLookupOf } from './repo-lookup-of.js'

/**
 * Elements whose `<url>` is not the project's own.
 */
const NESTED = [
  'parent',
  'organization',
  'licenses',
  'developers',
  'contributors',
  'scm',
  'issueManagement',
  'ciManagement',
  'mailingLists',
  'distributionManagement',
  'repositories',
  'pluginRepositories',
  'profiles',
  'build',
  'reporting',
  'dependencies',
  'dependencyManagement',
]

/**
 * A pom's repository candidates, best first: `<scm>`'s `url`, `connection` and `developerConnection` (their `scm:git:` prefix dropped), then the project's own `<url>`.
 *
 * @param pom the pom's text
 */
function pomUrlsOf(pom: string): (string | undefined)[] {
  const clean = pom.replace(/<!--[\s\S]*?-->/g, '')
  const scm = /<scm\b[^>]*>([\s\S]*?)<\/scm\s*>/i.exec(clean)?.[1] ?? ''
  const own = NESTED.reduce(
    (text, name) => text.replace(new RegExp(`<${name}\\b[^>]*>[\\s\\S]*?</${name}\\s*>`, 'gi'), ''),
    clean,
  )

  return [
    xmlChildOf(scm, 'url'),
    ...['connection', 'developerConnection'].map(name =>
      xmlChildOf(scm, name)?.replace(/^scm:[a-z]+:/i, ''),
    ),
    xmlChildOf(own, 'url'),
  ]
}

/**
 * Java and Kotlin: the pom's `<scm>` URLs, then its project `<url>`, from Maven Central, for the version in use or else the `<release>` its maven-metadata.xml names. A pom that inherits its scm from a parent stays unresolved.
 */
export const mavenLookup: RegistryLookup = (get, dependency) => {
  const [group = '', artifactName = '', ...rest] = dependency.name.split(':')
  const groups = group.split('.').map(part => pathSegmentOf(part, /^[\w-]+$/))
  const artifact = pathSegmentOf(artifactName)

  if (groups.includes(undefined) || artifact === undefined || rest.length > 0) {
    return Promise.resolve({ kind: 'none', reason: 'not a valid maven name' })
  }

  const base = `https://repo1.maven.org/maven2/${groups.join('/')}/${artifact}`

  return lookupVersioned(
    get,
    plainVersionOf(dependency.versionInUse),
    async () => {
      const metadata = await get(`${base}/maven-metadata.xml`)

      if (metadata.kind === 'missing') {
        return { kind: 'none', reason: `not found in the registry (HTTP ${metadata.status})` }
      }

      if (metadata.kind === 'failed') {
        return metadata
      }

      const version = plainVersionOf(
        xmlChildOf(metadata.text, 'release') ?? xmlChildOf(metadata.text, 'latest'),
      )

      return version === undefined
        ? { kind: 'none', reason: 'no versions in the registry' }
        : { kind: 'version', version }
    },
    version => `${base}/${version}/${artifact}-${version}.pom`,
    pom => repoLookupOf(pomUrlsOf(pom)),
  )
}
