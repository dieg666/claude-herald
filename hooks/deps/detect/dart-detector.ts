import type { Dependency } from '../../../types/index.js'
import { isRecord } from '../../store/is-record.js'
import { baseNameOf } from './base-name-of.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { exactVersionOf } from './exact-version-of.js'
import { nearestFileOf } from './nearest-file-of.js'
import { parseYaml } from './parse-yaml.js'
import { parsedFileOf } from './parsed-file-of.js'
import { recordAt } from './record-at.js'
import { stringsOf } from './strings-of.js'

/**
 * A pubspec file's first document as an object; throws when it is not one.
 *
 * @param text the file
 */
function pubspecOf(text: string): Record<string, unknown> {
  const [document] = parseYaml(text)

  if (!isRecord(document)) {
    throw new Error('not a YAML mapping')
  }

  return document
}

/**
 * The versions a pubspec.lock pins, by package name.
 *
 * @param text the lockfile
 */
function lockVersionsOf(text: string): Map<string, string> {
  const packages = recordAt(pubspecOf(text), 'packages')

  return new Map(
    Object.keys(packages).flatMap(name => {
      const { version } = recordAt(packages, name)

      return typeof version === 'string' ? [[name, version] as const] : []
    }),
  )
}

/**
 * Dart and Flutter: pubspec.yaml `dependencies` (runtime) and `dev_dependencies` (dev), versions from pubspec.lock, pub `workspace:` members; SDK (`flutter`), path and override entries and the project's own packages are left out, git entries keep their repository.
 */
export const DART_DETECTOR: Detector = {
  isManifest: name => name === 'pubspec.yaml',
  isCompanion: name => name === 'pubspec.lock',
  workspacesOf: files =>
    [...files.texts.keys()].flatMap(path => {
      const include =
        baseNameOf(path) === 'pubspec.yaml'
          ? stringsOf(parsedFileOf(files, path, pubspecOf)?.workspace)
          : []

      return include.length === 0
        ? []
        : [{ dir: dirOf(path), include, exclude: [], manifest: 'pubspec.yaml' }]
    }),
  depsOf: (files, manifests) => {
    const internal = new Set(
      [...files.texts.keys()]
        .filter(path => baseNameOf(path) === 'pubspec.yaml')
        .flatMap(path => {
          const name = parsedFileOf(files, path, pubspecOf)?.name

          return typeof name === 'string' ? [name] : []
        }),
    )

    return manifests.flatMap(manifest => {
      const pubspec = parsedFileOf(files, manifest, pubspecOf)
      const lockfile = nearestFileOf(files.texts, dirOf(manifest), ['pubspec.lock'])
      const locked =
        lockfile === undefined ? undefined : parsedFileOf(files, lockfile, lockVersionsOf)
      const sections = [
        ['dependencies', false],
        ['dev_dependencies', true],
      ] as const

      return pubspec === undefined
        ? []
        : sections.flatMap(([section, isDev]) =>
            Object.entries(recordAt(pubspec, section)).flatMap(([name, spec]): Dependency[] => {
              const details = isRecord(spec) ? spec : {}
              const git = isRecord(details.git) ? details.git.url : details.git
              const range =
                typeof spec === 'string'
                  ? spec
                  : typeof details.version === 'string'
                    ? details.version
                    : undefined

              if (internal.has(name) || details.sdk !== undefined || details.path !== undefined) {
                return []
              }

              return [
                dependencyAt({
                  ecosystem: 'pub',
                  name,
                  manifestPath: manifest,
                  isDev,
                  versionInUse:
                    locked?.get(name) ??
                    (typeof git === 'string' ? undefined : exactVersionOf(range)),
                  range,
                  source: typeof git === 'string' ? git : undefined,
                }),
              ]
            }),
          )
    })
  },
}
