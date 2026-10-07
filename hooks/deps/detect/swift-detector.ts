import type { Dependency } from '../../../types/index.js'
import { isRecord } from '../../store/is-record.js'
import { codeWithoutCommentsOf } from './code-without-comments-of.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { jsonRecordOf } from './json-record-of.js'
import { nearestFileOf } from './nearest-file-of.js'
import { parsedFileOf } from './parsed-file-of.js'
import { recordAt } from './record-at.js'

/**
 * A package's identity as SwiftPM derives it from its URL: the last path part, lower case, without `.git`.
 *
 * @param url the repository URL
 */
function identityOf(url: string): string {
  return (url.replace(/\/+$/, '').split(/[/:]/).pop() ?? url).replace(/\.git$/i, '').toLowerCase()
}

/**
 * The versions a Package.resolved (v1 to v3) pins, by identity.
 *
 * @param text the file
 */
function pinsOf(text: string): Map<string, string> {
  const json = jsonRecordOf(text)
  const pins = Array.isArray(json.pins) ? json.pins : recordAt(json, 'object').pins
  const versions = new Map<string, string>()

  for (const pin of Array.isArray(pins) ? pins : []) {
    const url = isRecord(pin) ? (pin.location ?? pin.repositoryURL) : undefined
    const identity =
      isRecord(pin) && typeof pin.identity === 'string'
        ? pin.identity
        : typeof url === 'string'
          ? identityOf(url)
          : undefined
    const version = recordAt(pin, 'state').version

    if (identity !== undefined && typeof version === 'string') {
      versions.set(identity.toLowerCase(), version)
    }
  }

  return versions
}

/**
 * The requirement of a `.package(...)` call as written, and the version it pins when it is `exact`.
 *
 * @param args the call's arguments
 */
function requirementOf(args: string): { range?: string; exact?: string } {
  const exact = /(?:exact:\s*|\.exact\(\s*)"([^"]+)"/.exec(args)

  if (exact !== null) {
    return { range: exact[1] ?? '', exact: exact[1] ?? '' }
  }

  const from = /(?:from:\s*|\.upTo(?:NextMajor|NextMinor)\(\s*from:\s*)"([^"]+)"/.exec(args)
  const between = /"([^"]+)"\s*(\.\.<|\.\.\.)\s*"([^"]+)"/.exec(args)

  if (from !== null) {
    return { range: `${/upToNextMinor/.test(args) ? '~' : '^'}${from[1] ?? ''}` }
  }

  return between === null
    ? {}
    : { range: `>=${between[1] ?? ''}, ${between[2] === '..<' ? '<' : '<='}${between[3] ?? ''}` }
}

/**
 * Swift: Package.swift `.package(url:...)` and `.package(id:...)` dependencies, versions from Package.resolved; `from:` reads as `^x`, `upToNextMinor` as `~x`, `exact:` pins the version. Local `.package(path:)` dependencies are left out.
 */
export const SWIFT_DETECTOR: Detector = {
  isManifest: name => name === 'Package.swift',
  isCompanion: name => name === 'Package.resolved',
  workspacesOf: () => [],
  depsOf: (files, manifests) =>
    manifests.flatMap(manifest => {
      const code = codeWithoutCommentsOf(files.texts.get(manifest) ?? '')
      const resolvedPath = nearestFileOf(files.texts, dirOf(manifest), ['Package.resolved'])
      const pins =
        resolvedPath === undefined ? undefined : parsedFileOf(files, resolvedPath, pinsOf)
      const calls = code.matchAll(/\.package\s*\(((?:[^()]|\([^()]*\))*)\)/g)

      return [...calls].flatMap((call): Dependency[] => {
        const args = call[1] ?? ''
        const url = /\burl:\s*"([^"]+)"/.exec(args)?.[1]
        const id = /\bid:\s*"([^"]+)"/.exec(args)?.[1]
        const name = url === undefined ? id?.toLowerCase() : identityOf(url)

        if (name === undefined) {
          return []
        }

        const requirement = requirementOf(args)

        return [
          dependencyAt({
            ecosystem: 'swift',
            name,
            manifestPath: manifest,
            isDev: false,
            versionInUse: pins?.get(name) ?? requirement.exact,
            range: requirement.range,
            source: url,
          }),
        ]
      })
    }),
}
