import type { Dependency } from '../../../types/index.js'
import { baseNameOf } from './base-name-of.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { exactVersionOf } from './exact-version-of.js'
import { parsedFileOf } from './parsed-file-of.js'
import { xmlChildOf } from './xml-child-of.js'
import { xmlWithoutCommentsOf } from './xml-without-comments-of.js'

/**
 * Sections whose `<dependency>` elements are not the project's own: managed versions, plugins, profiles, reports.
 */
const FOREIGN = ['dependencyManagement', 'build', 'profiles', 'reporting']

/**
 * A pom as the detector reads it.
 */
type Pom = {
  /** The project's own `group:artifact`. */
  coordinates: string
  parent: { group: string; artifact: string; version?: string } | undefined
  dependencies: {
    group: string
    artifact: string
    version?: string
    scope?: string
    isOptional: boolean
  }[]
  properties: Map<string, string>
}

/**
 * The XML with whole elements of these names removed.
 *
 * @param xml the document
 * @param names the element names
 */
function withoutElements(xml: string, names: readonly string[]): string {
  return names.reduce(
    (text, name) => text.replace(new RegExp(`<${name}\\b[^>]*>[\\s\\S]*?</${name}\\s*>`, 'g'), ''),
    xml,
  )
}

/**
 * Reads a pom.xml: its coordinates, parent, direct dependencies and properties; throws on a broken file.
 *
 * @param text the pom
 */
function pomOf(text: string): Pom {
  const xml = xmlWithoutCommentsOf(text, 'project')
  const parentXml = /<parent\b[^>]*>([\s\S]*?)<\/parent\s*>/.exec(xml)?.[1]
  const own = withoutElements(xml, [...FOREIGN, 'parent'])
  const head = withoutElements(own, ['dependencies', 'properties'])
  const parentGroup = parentXml === undefined ? undefined : xmlChildOf(parentXml, 'groupId')
  const parentArtifact = parentXml === undefined ? undefined : xmlChildOf(parentXml, 'artifactId')
  const parentVersion = parentXml === undefined ? undefined : xmlChildOf(parentXml, 'version')
  const group = xmlChildOf(head, 'groupId') ?? parentGroup ?? ''
  const version = xmlChildOf(head, 'version') ?? parentVersion
  const properties = new Map<string, string>([
    ['project.groupId', group],
    ...(version === undefined ? [] : [['project.version', version] as const]),
  ])

  for (const block of own.matchAll(/<properties\b[^>]*>([\s\S]*?)<\/properties\s*>/g)) {
    for (const match of (block[1] ?? '').matchAll(/<([\w.-]+)\b[^>]*>([^<]*)<\/\1\s*>/g)) {
      properties.set(match[1] ?? '', (match[2] ?? '').trim())
    }
  }

  const dependencies = [...own.matchAll(/<dependency\b[^>]*>([\s\S]*?)<\/dependency\s*>/g)].map(
    match => {
      const body = match[1] ?? ''
      const depVersion = xmlChildOf(body, 'version')
      const scope = xmlChildOf(body, 'scope')

      return {
        group: xmlChildOf(body, 'groupId') ?? '',
        artifact: xmlChildOf(body, 'artifactId') ?? '',
        ...(depVersion === undefined ? {} : { version: depVersion }),
        ...(scope === undefined ? {} : { scope }),
        isOptional: xmlChildOf(body, 'optional') === 'true',
      }
    },
  )

  return {
    coordinates: `${group}:${xmlChildOf(head, 'artifactId') ?? ''}`,
    parent:
      parentGroup && parentArtifact
        ? {
            group: parentGroup,
            artifact: parentArtifact,
            ...(parentVersion === undefined ? {} : { version: parentVersion }),
          }
        : undefined,
    dependencies,
    properties,
  }
}

/**
 * A version with `${property}` references replaced, or undefined when one cannot be resolved.
 *
 * @param version the version as written
 * @param properties the pom's properties
 */
function resolvedOf(
  version: string | undefined,
  properties: ReadonlyMap<string, string>,
): string | undefined {
  let text = version

  for (let pass = 0; pass < 5 && text?.includes('${'); pass += 1) {
    text = text.replace(/\$\{([^}]+)\}/g, (whole, name: string) => properties.get(name) ?? whole)
  }

  return text?.includes('${') ? undefined : text
}

/**
 * Java and Kotlin with Maven: pom.xml `<dependencies>` and the `<parent>` (a Spring Boot parent is followed like a dependency); `test` scope and optional dependencies count as dev; `${property}` versions resolved from `<properties>`. Versions a parent or BOM manages stay empty; dependencies on the project's own modules (`${project.version}`, or coordinates of a pom in the project) are left out.
 */
export const MAVEN_DETECTOR: Detector = {
  isManifest: name => name === 'pom.xml',
  isCompanion: () => false,
  workspacesOf: () => [],
  depsOf: (files, manifests) => {
    const internal = new Set(
      [...files.texts.keys()]
        .filter(path => baseNameOf(path) === 'pom.xml')
        .flatMap(path => {
          const pom = parsedFileOf(files, path, pomOf)

          return pom === undefined ? [] : [pom.coordinates]
        }),
    )

    return manifests.flatMap(manifest => {
      const pom = parsedFileOf(files, manifest, pomOf)

      if (pom === undefined) {
        return []
      }

      const declared = [
        ...(pom.parent === undefined ? [] : [{ ...pom.parent, isOptional: false }]),
        ...pom.dependencies,
      ]

      return declared.flatMap((dependency): Dependency[] => {
        const name = `${dependency.group}:${dependency.artifact}`
        const isOwnVersion = /\$\{project\.(?:parent\.)?version\}/.test(dependency.version ?? '')
        const version = resolvedOf(dependency.version, pom.properties)

        return !dependency.group || !dependency.artifact || isOwnVersion || internal.has(name)
          ? []
          : [
              dependencyAt({
                ecosystem: 'maven',
                name,
                manifestPath: manifest,
                isDev:
                  ('scope' in dependency && dependency.scope === 'test') || dependency.isOptional,
                versionInUse: exactVersionOf(version),
                range: version,
              }),
            ]
      })
    })
  },
}
