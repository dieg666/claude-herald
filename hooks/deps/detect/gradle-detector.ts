import type { Dependency } from '../../../types/index.js'
import { isRecord } from '../../store/is-record.js'
import { codeWithoutCommentsOf } from './code-without-comments-of.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { exactVersionOf } from './exact-version-of.js'
import { nearestFileOf } from './nearest-file-of.js'
import { parseToml } from './parse-toml.js'
import { parsedFileOf } from './parsed-file-of.js'
import { recordAt } from './record-at.js'
import { stringsOf } from './strings-of.js'

/**
 * The version catalog Gradle reads by default.
 */
const CATALOG = 'gradle/libs.versions.toml'

/**
 * Dependency configurations Gradle and its common plugins declare.
 */
const CONFIGURATIONS =
  /^(?:implementation|api|compileOnly|runtimeOnly|compile|runtime|annotationProcessor|kapt|ksp|classpath|developmentOnly|checkstyle|detektPlugins|lintChecks|coreLibraryDesugaring|baselineProfile|[a-z][A-Za-z0-9]*(?:Implementation|Api|CompileOnly|RuntimeOnly|AnnotationProcessor)|(?:kapt|ksp)[A-Z][A-Za-z0-9]*)$/

/**
 * Configurations for tests, debug builds and build tooling: their dependencies count as dev.
 */
const DEV_CONFIGURATIONS =
  /^(?:test|androidTest|debug|developmentOnly|checkstyle|detektPlugins|lintChecks|coreLibraryDesugaring|baselineProfile|classpath)|Test/

/**
 * One library as a catalog or a build file names it.
 */
type Library = { name: string; version?: string | undefined }

/**
 * A catalog alias or accessor as Gradle matches them: `-`, `_` and `.` alike, case ignored.
 *
 * @param alias `androidx-core-ktx` or `androidx.core.ktx`
 */
function accessorOf(alias: string): string {
  return alias.replace(/[-_.]/g, '.').toLowerCase()
}

/**
 * A catalog version: a string, a `{ ref }` into `[versions]`, or a rich `{ strictly, require, prefer }`.
 *
 * @param value the version entry
 * @param versions the catalog's `[versions]`
 */
function catalogVersionOf(value: unknown, versions: Record<string, unknown>): string | undefined {
  if (typeof value === 'string') {
    return value
  }

  const rich = isRecord(value) ? value : {}
  const reference = typeof rich.ref === 'string' ? versions[rich.ref] : undefined

  if (reference !== undefined) {
    return catalogVersionOf(reference, versions)
  }

  const picked = rich.strictly ?? rich.require ?? rich.prefer

  return typeof picked === 'string' ? picked : undefined
}

/**
 * A libs.versions.toml as libraries by accessor, and bundles by accessor.
 *
 * @param text the catalog
 */
function catalogOf(text: string): {
  libraries: Map<string, Library>
  bundles: Map<string, string[]>
} {
  const toml = parseToml(text)
  const versions = recordAt(toml, 'versions')
  const libraries = new Map<string, Library>()

  for (const [alias, value] of Object.entries(recordAt(toml, 'libraries'))) {
    const entry = typeof value === 'string' ? { module: value } : isRecord(value) ? value : {}
    const [group, artifact, inline] =
      typeof entry.module === 'string'
        ? entry.module.split(':')
        : [entry.group, entry.name].map(part => (typeof part === 'string' ? part : ''))

    if (group && artifact) {
      libraries.set(accessorOf(alias), {
        name: `${group}:${artifact}`,
        version: inline ?? catalogVersionOf(entry.version, versions),
      })
    }
  }

  const bundles = new Map(
    Object.entries(recordAt(toml, 'bundles')).map(([alias, list]) => [
      accessorOf(alias),
      stringsOf(list).map(accessorOf),
    ]),
  )

  return { libraries, bundles }
}

/**
 * The simple string assignments a build file or gradle.properties makes (`ext.x = "1"`, `val x = "1"`, `x=1`), for `$x` versions.
 *
 * @param texts the build file and gradle.properties
 */
function variablesOf(texts: readonly string[]): Map<string, string> {
  const variables = new Map<string, string>()

  for (const text of texts) {
    for (const match of text.matchAll(
      /(?:^|[\s{;])([A-Za-z_][\w.]*)\s*=\s*["']([^"'$\n]+)["']/gm,
    )) {
      const name = match[1] ?? ''

      variables.set(name, match[2] ?? '')
      variables.set(name.slice(name.lastIndexOf('.') + 1), match[2] ?? '')
    }

    for (const match of text.matchAll(/^\s*([A-Za-z_][\w.-]*)\s*[=:]\s*([^\s"'$]+)\s*$/gm)) {
      variables.set(match[1] ?? '', match[2] ?? '')
    }
  }

  return variables
}

/**
 * Gradle (Groovy and Kotlin DSL): `group:name:version` strings and version-catalog references (`libs.x.y`, `libs.bundles.z`) in dependency configurations; test, debug and tooling configurations count as dev; `$var` versions resolved from the build file and gradle.properties. Project dependencies and plugins are left out; a version a BOM or platform manages stays empty.
 */
export const GRADLE_DETECTOR: Detector = {
  isManifest: name => name === 'build.gradle' || name === 'build.gradle.kts',
  isCompanion: name => name === 'libs.versions.toml' || name === 'gradle.properties',
  workspacesOf: () => [],
  depsOf: (files, manifests) =>
    manifests.flatMap(manifest => {
      const code = codeWithoutCommentsOf(files.texts.get(manifest) ?? '')
      const catalogPath = nearestFileOf(files.texts, dirOf(manifest), [CATALOG])
      const catalog =
        catalogPath === undefined ? undefined : parsedFileOf(files, catalogPath, catalogOf)
      const propertiesPath = nearestFileOf(files.texts, dirOf(manifest), ['gradle.properties'])
      const variables = variablesOf([files.texts.get(propertiesPath ?? '') ?? '', code])
      const pattern =
        /\b([a-z][A-Za-z0-9]*)\s*\(?\s*(?:(?:platform|enforcedPlatform|testFixtures)\s*\(\s*)?(?:"([^"\n]+)"|'([^'\n]+)'|libs\.([A-Za-z0-9_.]+))/g

      return [...code.matchAll(pattern)].flatMap((match): Dependency[] => {
        const configuration = match[1] ?? ''

        if (!CONFIGURATIONS.test(configuration)) {
          return []
        }

        const accessor = (match[4] ?? '').toLowerCase()
        const libraries: Library[] = accessor.startsWith('bundles.')
          ? (catalog?.bundles.get(accessor.slice(8)) ?? []).flatMap(alias => {
              const library = catalog?.libraries.get(alias)

              return library === undefined ? [] : [library]
            })
          : match[4] !== undefined
            ? [catalog?.libraries.get(accessor)].filter(library => library !== undefined)
            : (() => {
                const [group, artifact, version] = (match[2] ?? match[3] ?? '')
                  .replace(/@\w+$/, '')
                  .split(':')

                return group && artifact && !/[\s$]/.test(group + artifact)
                  ? [{ name: `${group}:${artifact}`, version }]
                  : []
              })()

        return libraries.map(library => {
          const raw = library.version?.replace(
            /\$\{?([\w.]+)\}?/g,
            (whole, name: string) => variables.get(name) ?? whole,
          )
          const version = raw?.includes('$') ? undefined : raw

          return dependencyAt({
            ecosystem: 'maven',
            name: library.name,
            manifestPath: manifest,
            isDev: DEV_CONFIGURATIONS.test(configuration),
            versionInUse: exactVersionOf(version),
            range: version,
          })
        })
      })
    }),
}
