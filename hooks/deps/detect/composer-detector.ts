import type { Dependency } from '../../../types/index.js'
import { isRecord } from '../../store/is-record.js'
import { baseNameOf } from './base-name-of.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { exactVersionOf } from './exact-version-of.js'
import { jsonRecordOf } from './json-record-of.js'
import { nearestFileOf } from './nearest-file-of.js'
import { parsedFileOf } from './parsed-file-of.js'
import { recordAt } from './record-at.js'

/**
 * Requirements on the platform rather than on a package: PHP itself, extensions, system libraries, Composer.
 */
const PLATFORM =
  /^(?:php(?:-64bit|-ipv6|-zts|-debug)?|hhvm|ext-.+|lib-.+|composer(?:-plugin-api|-runtime-api)?)$/i

/**
 * The versions composer.lock pins (`packages` and `packages-dev`), by lower-case name.
 *
 * @param text the lockfile
 */
function lockVersionsOf(text: string): Map<string, string> {
  const lock = jsonRecordOf(text)
  const versions = new Map<string, string>()

  for (const list of [lock.packages, lock['packages-dev']]) {
    for (const entry of Array.isArray(list) ? list : []) {
      if (isRecord(entry) && typeof entry.name === 'string' && typeof entry.version === 'string') {
        versions.set(entry.name.toLowerCase(), entry.version)
      }
    }
  }

  return versions
}

/**
 * PHP: composer.json `require` (runtime) and `require-dev` (dev), versions from composer.lock; platform requirements (`php`, `ext-*`, `lib-*`) and the project's own packages are left out.
 */
export const COMPOSER_DETECTOR: Detector = {
  isManifest: name => name === 'composer.json',
  isCompanion: name => name === 'composer.lock',
  workspacesOf: () => [],
  depsOf: (files, manifests) => {
    const internal = new Set(
      [...files.texts.keys()]
        .filter(path => baseNameOf(path) === 'composer.json')
        .flatMap(path => {
          const name = parsedFileOf(files, path, jsonRecordOf)?.name

          return typeof name === 'string' ? [name.toLowerCase()] : []
        }),
    )

    return manifests.flatMap(manifest => {
      const json = parsedFileOf(files, manifest, jsonRecordOf)
      const lockfile = nearestFileOf(files.texts, dirOf(manifest), ['composer.lock'])
      const locked =
        lockfile === undefined ? undefined : parsedFileOf(files, lockfile, lockVersionsOf)
      const sections = [
        ['require', false],
        ['require-dev', true],
      ] as const

      return json === undefined
        ? []
        : sections.flatMap(([section, isDev]) =>
            Object.entries(recordAt(json, section)).flatMap(([declared, range]): Dependency[] => {
              const name = declared.toLowerCase()

              return typeof range !== 'string' || PLATFORM.test(name) || internal.has(name)
                ? []
                : [
                    dependencyAt({
                      ecosystem: 'packagist',
                      name,
                      manifestPath: manifest,
                      isDev,
                      versionInUse: locked?.get(name) ?? exactVersionOf(range),
                      range,
                    }),
                  ]
            }),
          )
    })
  },
}
