import type { Dependency } from '../../../types/index.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { exactVersionOf } from './exact-version-of.js'
import { nearestFileOf } from './nearest-file-of.js'
import { parsedFileOf } from './parsed-file-of.js'
import { xmlAttributeOf } from './xml-attribute-of.js'
import { xmlChildOf } from './xml-child-of.js'
import { xmlWithoutCommentsOf } from './xml-without-comments-of.js'

/**
 * A .NET project file.
 */
const PROJECT = /\.(?:cs|fs|vb)proj$/i

/**
 * The central package versions file.
 */
const CENTRAL = 'Directory.Packages.props'

/**
 * One `<PackageReference>` or `<PackageVersion>` element: its attributes and its inner XML.
 *
 * @param xml the document
 * @param element the element name
 */
function elementsOf(xml: string, element: string): { attributes: string; body: string }[] {
  const pattern = new RegExp(`<${element}\\b([^>]*?)(?:/>|>([\\s\\S]*?)</${element}\\s*>)`, 'gi')

  return [...xml.matchAll(pattern)].map(match => ({
    attributes: match[1] ?? '',
    body: match[2] ?? '',
  }))
}

/**
 * The versions a Directory.Packages.props sets, by lower-case package id.
 *
 * @param text the file
 */
function centralVersionsOf(text: string): Map<string, string> {
  const xml = xmlWithoutCommentsOf(text, 'Project')

  return new Map(
    elementsOf(xml, 'PackageVersion').flatMap(({ attributes, body }) => {
      const id = xmlAttributeOf(attributes, 'Include')
      const version = xmlAttributeOf(attributes, 'Version') ?? xmlChildOf(body, 'Version')

      return id && version ? [[id.toLowerCase(), version] as const] : []
    }),
  )
}

/**
 * .NET: `<PackageReference>` in *.csproj, *.fsproj and *.vbproj, versions inline or from the nearest Directory.Packages.props; a test project's references and `PrivateAssets="all"` ones (analyzers, build tools) count as dev. A plain version is the one in use (NuGet picks the lowest that fits); a bracket range or a `$(Property)` stays a range.
 */
export const DOTNET_DETECTOR: Detector = {
  isManifest: name => PROJECT.test(name),
  isCompanion: name => name === CENTRAL,
  workspacesOf: () => [],
  depsOf: (files, manifests) =>
    manifests.flatMap(manifest => {
      const xml = parsedFileOf(files, manifest, text => xmlWithoutCommentsOf(text, 'Project'))

      if (xml === undefined) {
        return []
      }

      const centralPath = nearestFileOf(files.texts, dirOf(manifest), [CENTRAL])
      const central =
        centralPath === undefined ? undefined : parsedFileOf(files, centralPath, centralVersionsOf)
      const references = elementsOf(xml, 'PackageReference')
      const isTestProject =
        /<IsTestProject>\s*true\s*<\/IsTestProject>/i.test(xml) ||
        references.some(
          ({ attributes }) =>
            xmlAttributeOf(attributes, 'Include')?.toLowerCase() === 'microsoft.net.test.sdk',
        )

      return references.flatMap(({ attributes, body }): Dependency[] => {
        const id = xmlAttributeOf(attributes, 'Include')

        if (!id) {
          return []
        }

        const version =
          xmlAttributeOf(attributes, 'VersionOverride') ??
          xmlAttributeOf(attributes, 'Version') ??
          xmlChildOf(body, 'VersionOverride') ??
          xmlChildOf(body, 'Version') ??
          central?.get(id.toLowerCase())
        const privateAssets =
          xmlAttributeOf(attributes, 'PrivateAssets') ?? xmlChildOf(body, 'PrivateAssets')
        const range = version?.includes('$(') ? undefined : version

        return [
          dependencyAt({
            ecosystem: 'nuget',
            name: id,
            manifestPath: manifest,
            isDev: isTestProject || privateAssets?.toLowerCase() === 'all',
            versionInUse: exactVersionOf(range),
            range,
          }),
        ]
      })
    }),
}
