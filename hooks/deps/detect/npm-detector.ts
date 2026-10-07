import type { Dependency } from '../../../types/index.js'
import { isRecord } from '../../store/is-record.js'
import { baseNameOf } from './base-name-of.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { exactVersionOf } from './exact-version-of.js'
import { jsonRecordOf } from './json-record-of.js'
import { nearestFileOf } from './nearest-file-of.js'
import { npmLockVersionsOf } from './npm-lock-versions-of.js'
import { parseYaml } from './parse-yaml.js'
import { parsedFileOf } from './parsed-file-of.js'
import { pnpmLockVersionsOf } from './pnpm-lock-versions-of.js'
import type { ProjectFiles } from './project-files.js'
import { recordAt } from './record-at.js'
import { stringsOf } from './strings-of.js'
import type { Workspace } from './workspace.js'
import { yarnLockVersionsOf } from './yarn-lock-versions-of.js'

/**
 * The lockfiles npm, pnpm and yarn write, in order of preference within one directory.
 */
const LOCKFILES = ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock']

/**
 * The pnpm workspace file.
 */
const PNPM_WORKSPACE = 'pnpm-workspace.yaml'

/**
 * Looks up the installed version of a package declared by one manifest.
 */
type Lookup = (name: string, range: string) => string | undefined

/**
 * Looks up an installed version in one lockfile, for a member directory relative to it.
 */
type LockLookup = (member: string, name: string, range: string) => string | undefined

/**
 * A path relative to a directory below which it lies, `''` for the directory itself.
 *
 * @param path a directory relative to the root
 * @param base a directory at or above it
 */
function relativeTo(path: string, base: string): string {
  return base === '' ? path : path === base ? '' : path.slice(base.length + 1)
}

/**
 * The version lookup for a manifest from its nearest lockfile, each lockfile parsed once.
 *
 * @param files the files read
 * @param manifest the package.json path
 * @param parsed lockfiles parsed so far, by path (undefined when broken)
 */
function lookupOf(
  files: ProjectFiles,
  manifest: string,
  parsed: Map<string, LockLookup | undefined>,
): Lookup | undefined {
  const dir = dirOf(manifest)
  const lockfile = nearestFileOf(files.texts, dir, LOCKFILES)

  if (lockfile === undefined) {
    return undefined
  }

  if (!parsed.has(lockfile)) {
    const name = baseNameOf(lockfile)

    parsed.set(
      lockfile,
      parsedFileOf(files, lockfile, (text): LockLookup => {
        if (name === 'pnpm-lock.yaml') {
          const lookup = pnpmLockVersionsOf(text)

          return (member: string, pkg: string) => lookup(member === '' ? '.' : member, pkg)
        }

        if (name === 'yarn.lock') {
          const lookup = yarnLockVersionsOf(text)

          return (_: string, pkg: string, range: string) => lookup(pkg, range)
        }

        const lookup = npmLockVersionsOf(text)

        return (member: string, pkg: string) => lookup(member, pkg)
      }),
    )
  }

  const lookup = parsed.get(lockfile)
  const member = relativeTo(dir, dirOf(lockfile))

  return lookup === undefined ? undefined : (name, range) => lookup(member, name, range)
}

/**
 * The pnpm catalogs a manifest's `catalog:` ranges refer to, from the nearest pnpm-workspace.yaml: the default one under `''`.
 *
 * @param files the files read
 * @param manifest the package.json path
 */
function catalogsOf(
  files: ProjectFiles,
  manifest: string,
): Record<string, Record<string, unknown>> {
  const path = nearestFileOf(files.texts, dirOf(manifest), [PNPM_WORKSPACE])
  const document = path === undefined ? undefined : parsedFileOf(files, path, parseYaml)?.[0]
  const named = recordAt(document, 'catalogs')

  return {
    ...Object.fromEntries(Object.keys(named).map(key => [key, recordAt(named, key)])),
    '': recordAt(document, 'catalog'),
  }
}

/**
 * The workspace patterns of a package.json `workspaces` field (a list, or `{ packages }`).
 *
 * @param manifest the parsed package.json
 */
function patternsOf(manifest: Record<string, unknown>): string[] {
  const { workspaces } = manifest

  return stringsOf(isRecord(workspaces) ? workspaces.packages : workspaces)
}

/**
 * A workspace from patterns where `!` marks an exclusion.
 *
 * @param dir the workspace's directory
 * @param patterns the patterns as written
 */
function workspaceOf(dir: string, patterns: readonly string[]): Workspace {
  return {
    dir,
    include: patterns.filter(pattern => !pattern.startsWith('!')),
    exclude: patterns.filter(pattern => pattern.startsWith('!')).map(pattern => pattern.slice(1)),
    manifest: 'package.json',
  }
}

/**
 * The dependencies one package.json declares.
 *
 * @param files the files read
 * @param manifest its path
 * @param internal the names of the project's own packages
 * @param parsed lockfiles parsed so far
 */
function manifestDepsOf(
  files: ProjectFiles,
  manifest: string,
  internal: ReadonlySet<string>,
  parsed: Map<string, LockLookup | undefined>,
): Dependency[] {
  const json = parsedFileOf(files, manifest, jsonRecordOf)

  if (json === undefined) {
    return []
  }

  const lookup = lookupOf(files, manifest, parsed)
  const catalogs = catalogsOf(files, manifest)
  const sections = [
    ['dependencies', false],
    ['devDependencies', true],
  ] as const

  return sections.flatMap(([section, isDev]) =>
    Object.entries(recordAt(json, section)).flatMap(([declared, spec]) => {
      if (typeof spec !== 'string' || internal.has(declared)) {
        return []
      }

      if (
        /^(?:workspace|link|file|portal|patch|exec):/.test(spec) ||
        /^(?:\.{1,2}|~)?\//.test(spec)
      ) {
        return []
      }

      const alias = /^npm:((?:@[^/@]+\/)?[^@]+)(?:@(.*))?$/.exec(spec)
      const catalog = /^catalog:(.*)$/.exec(spec)
      const catalogName = catalog?.[1]?.trim() === 'default' ? '' : (catalog?.[1]?.trim() ?? '')
      const catalogRange = catalog === null ? undefined : catalogs[catalogName]?.[declared]
      const range = alias !== null ? alias[2] : catalog !== null ? catalogRange : spec
      const isRemote =
        /^(?:git\+|git:|github:|gitlab:|bitbucket:|https?:)|^[\w.-]+\/[\w.-]+(?:#.*)?$/.test(spec)
      const name = alias?.[1] ?? declared
      const locked = lookup?.(declared, spec)
      const inUse =
        locked ??
        (typeof range === 'string' && /^\d+\.\d+\.\d+/.test(range)
          ? exactVersionOf(range)
          : undefined)

      return [
        dependencyAt({
          ecosystem: 'npm',
          name,
          manifestPath: manifest,
          isDev,
          versionInUse: isRemote ? undefined : inUse,
          range: isRemote || typeof range !== 'string' ? undefined : range,
          source: isRemote ? spec : undefined,
        }),
      ]
    }),
  )
}

/**
 * JavaScript and TypeScript: package.json `dependencies` (runtime) and `devDependencies` (dev), versions from package-lock.json, npm-shrinkwrap.json, pnpm-lock.yaml or yarn.lock, npm/yarn `workspaces` and pnpm-workspace.yaml members, pnpm `catalog:` ranges. The project's own packages and local (`workspace:`, `file:`, `link:`, path) dependencies are left out; peer and optional dependencies are not followed.
 */
export const NPM_DETECTOR: Detector = {
  isManifest: name => name === 'package.json',
  isCompanion: name => LOCKFILES.includes(name) || name === PNPM_WORKSPACE,
  isOwnLockfile: name => LOCKFILES.includes(name),
  workspacesOf: files =>
    [...files.texts.keys()].flatMap(path => {
      if (baseNameOf(path) === PNPM_WORKSPACE) {
        const patterns = stringsOf(recordAt(parsedFileOf(files, path, parseYaml)?.[0]).packages)

        return patterns.length === 0 ? [] : [workspaceOf(dirOf(path), patterns)]
      }

      if (baseNameOf(path) !== 'package.json') {
        return []
      }

      const json = parsedFileOf(files, path, jsonRecordOf)
      const patterns = json === undefined ? [] : patternsOf(json)

      return patterns.length === 0 ? [] : [workspaceOf(dirOf(path), patterns)]
    }),
  depsOf: (files, manifests) => {
    const internal = new Set(
      [...files.texts.keys()]
        .filter(path => baseNameOf(path) === 'package.json')
        .flatMap(path => {
          const name = parsedFileOf(files, path, jsonRecordOf)?.name

          return typeof name === 'string' ? [name] : []
        }),
    )
    const parsed = new Map<string, LockLookup | undefined>()

    return manifests.flatMap(manifest => manifestDepsOf(files, manifest, internal, parsed))
  },
}
