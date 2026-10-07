import type { Dependency } from '../../../types/index.js'
import { isRecord } from '../../store/is-record.js'
import { baseNameOf } from './base-name-of.js'
import { childPathOf } from './child-path-of.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { exactVersionOf } from './exact-version-of.js'
import { nearestFileOf } from './nearest-file-of.js'
import { numericPartsOf } from './numeric-parts-of.js'
import { parseToml } from './parse-toml.js'
import { parsedFileOf } from './parsed-file-of.js'
import type { ProjectFiles } from './project-files.js'
import { recordAt } from './record-at.js'
import { stringsOf } from './strings-of.js'

/**
 * The dependency tables of a manifest (or of one `[target.*]` table) and whether each is dev.
 */
const SECTIONS = [
  ['dependencies', false],
  ['dev-dependencies', true],
  ['build-dependencies', true],
] as const

/**
 * Every version Cargo.lock pins, by crate name, oldest first as Cargo writes them.
 *
 * @param text the lockfile
 */
function lockVersionsOf(text: string): Map<string, string[]> {
  const packages = parseToml(text).package
  const versions = new Map<string, string[]>()

  for (const entry of Array.isArray(packages) ? packages : []) {
    if (isRecord(entry) && typeof entry.name === 'string' && typeof entry.version === 'string') {
      versions.set(entry.name, [...(versions.get(entry.name) ?? []), entry.version])
    }
  }

  return versions
}

/**
 * The locked version a requirement resolved to: the only one, else the newest that keeps the requirement's leftmost non-zero part (Cargo's caret rule).
 *
 * @param versions every locked version of the crate
 * @param range the requirement
 */
function lockedOf(versions: readonly string[], range: string | undefined): string | undefined {
  if (versions.length <= 1 || range === undefined) {
    return versions[versions.length - 1]
  }

  const wanted = numericPartsOf(range)
  const significant = wanted.findIndex(part => part !== 0)
  const keep = wanted.slice(0, significant < 0 ? wanted.length : significant + 1)
  const compatible = versions.filter(version => {
    const parts = numericPartsOf(version)

    return keep.every((part, index) => parts[index] === part)
  })

  return compatible[compatible.length - 1] ?? versions[versions.length - 1]
}

/**
 * The nearest manifest at or above a directory that declares a `[workspace]`, parsed.
 *
 * @param files the files read
 * @param dir where to start
 */
function workspaceRootOf(files: ProjectFiles, dir: string): Record<string, unknown> {
  for (let current = dir; ; current = dirOf(current)) {
    const toml = parsedFileOf(files, childPathOf(current, 'Cargo.toml'), parseToml)

    if (toml !== undefined && isRecord(toml.workspace)) {
      return toml
    }

    if (current === '') {
      return {}
    }
  }
}

/**
 * The dependencies of one dependency table.
 *
 * @param table the table
 * @param isDev whether it is dev or build-only
 * @param inherited the workspace's `[workspace.dependencies]`
 */
function tableDepsOf(
  table: Record<string, unknown>,
  isDev: boolean,
  inherited: Record<string, unknown>,
): { name: string; range?: string | undefined; source?: string | undefined; isDev: boolean }[] {
  return Object.entries(table).flatMap(([key, value]) => {
    const own = isRecord(value) ? value : { version: value }
    const base = own.workspace === true ? inherited[key] : undefined
    const spec = {
      ...(isRecord(base) ? base : typeof base === 'string' ? { version: base } : {}),
      ...own,
    }

    if (spec.path !== undefined) {
      return []
    }

    return [
      {
        name: typeof spec.package === 'string' ? spec.package : key,
        range: typeof spec.version === 'string' ? spec.version : undefined,
        source: typeof spec.git === 'string' ? spec.git : undefined,
        isDev,
      },
    ]
  })
}

/**
 * Rust: Cargo.toml `[dependencies]` (runtime), `[dev-dependencies]` and `[build-dependencies]` (dev), `[target.*]` tables too, `workspace = true` from `[workspace.dependencies]`, versions from Cargo.lock, `[workspace]` members. Path dependencies (the workspace's own crates) and the project's own crates are left out; a renamed dependency is followed by its `package` name.
 */
export const CARGO_DETECTOR: Detector = {
  isManifest: name => name === 'Cargo.toml',
  isCompanion: name => name === 'Cargo.lock',
  workspacesOf: files =>
    [...files.texts.keys()].flatMap(path => {
      const toml =
        baseNameOf(path) === 'Cargo.toml' ? parsedFileOf(files, path, parseToml) : undefined
      const workspace = recordAt(toml, 'workspace')

      return isRecord(toml?.workspace)
        ? [
            {
              dir: dirOf(path),
              include: stringsOf(workspace.members),
              exclude: stringsOf(workspace.exclude),
              manifest: 'Cargo.toml',
            },
          ]
        : []
    }),
  depsOf: (files, manifests) => {
    const internal = new Set(
      [...files.texts.keys()]
        .filter(path => baseNameOf(path) === 'Cargo.toml')
        .flatMap(path => {
          const name = recordAt(parsedFileOf(files, path, parseToml), 'package').name

          return typeof name === 'string' ? [name] : []
        }),
    )

    return manifests.flatMap(manifest => {
      const toml = parsedFileOf(files, manifest, parseToml)

      if (toml === undefined) {
        return []
      }

      const inherited = recordAt(
        workspaceRootOf(files, dirOf(manifest)),
        'workspace',
        'dependencies',
      )
      const targets = Object.keys(recordAt(toml, 'target')).map(target =>
        recordAt(toml, 'target', target),
      )
      const lockfile = nearestFileOf(files.texts, dirOf(manifest), ['Cargo.lock'])
      const locked =
        lockfile === undefined ? undefined : parsedFileOf(files, lockfile, lockVersionsOf)

      return [toml, ...targets]
        .flatMap(scope =>
          SECTIONS.flatMap(([section, isDev]) =>
            tableDepsOf(recordAt(scope, section), isDev, inherited),
          ),
        )
        .filter(entry => !internal.has(entry.name))
        .map((entry): Dependency =>
          dependencyAt({
            ecosystem: 'cargo',
            name: entry.name,
            manifestPath: manifest,
            isDev: entry.isDev,
            versionInUse:
              lockedOf(locked?.get(entry.name) ?? [], entry.range) ??
              (entry.range?.trim().startsWith('=') ? exactVersionOf(entry.range) : undefined),
            range: entry.range,
            source: entry.source,
          }),
        )
    })
  },
}
