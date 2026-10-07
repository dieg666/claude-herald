import type { Dependency } from '../../../types/index.js'
import { isRecord } from '../../store/is-record.js'
import { baseNameOf } from './base-name-of.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { exactVersionOf } from './exact-version-of.js'
import { nearestFileOf } from './nearest-file-of.js'
import { parseToml } from './parse-toml.js'
import { parsedFileOf } from './parsed-file-of.js'
import { pep508Of } from './pep508-of.js'
import type { ProjectFiles } from './project-files.js'
import { pypiNameOf } from './pypi-name-of.js'
import { recordAt } from './record-at.js'
import { stringsOf } from './strings-of.js'

/**
 * The lockfiles Poetry and uv write.
 */
const LOCKFILES = ['uv.lock', 'poetry.lock']

/**
 * A requirements file name: `requirements.txt`, `requirements-dev.txt`, `requirements_test.txt`, ...
 */
const REQUIREMENTS = /^requirements.*\.txt$/i

/**
 * A requirements file whose name says it is for development.
 */
const DEV_REQUIREMENTS =
  /(?:^|[-_.])(?:dev|develop|tests?|testing|lint|docs?|ci|typing|types|check|bench)(?=[-_.]|$)/i

/**
 * One declaration before versions are looked up.
 */
type Declared = {
  name: string
  range?: string | undefined
  source?: string | undefined
  isDev: boolean
}

/**
 * The versions a uv.lock or poetry.lock pins, by normalized name (the first entry of a name wins).
 *
 * @param text the lockfile
 */
function lockVersionsOf(text: string): Map<string, string> {
  const packages = parseToml(text).package
  const versions = new Map<string, string>()

  for (const entry of Array.isArray(packages) ? packages : []) {
    if (isRecord(entry) && typeof entry.name === 'string' && typeof entry.version === 'string') {
      const name = pypiNameOf(entry.name)

      if (!versions.has(name)) {
        versions.set(name, entry.version)
      }
    }
  }

  return versions
}

/**
 * PEP 508 strings as declarations.
 *
 * @param value a list of requirement strings
 * @param isDev whether they are dev
 */
function requirementsOf(value: unknown, isDev: boolean): Declared[] {
  return stringsOf(value).flatMap(text => {
    const requirement = pep508Of(text)

    return requirement === undefined ? [] : [{ ...requirement, isDev }]
  })
}

/**
 * Poetry's `name = constraint` tables as declarations; `python` and path dependencies left out, optional ones counted as dev.
 *
 * @param table a Poetry dependencies table
 * @param isDev whether the group is dev
 */
function poetryOf(table: Record<string, unknown>, isDev: boolean): Declared[] {
  return Object.entries(table).flatMap(([name, value]): Declared[] => {
    const spec = Array.isArray(value) ? value[0] : value

    if (name.toLowerCase() === 'python') {
      return []
    }

    if (typeof spec === 'string') {
      return [{ name, range: spec, isDev }]
    }

    if (!isRecord(spec) || spec.path !== undefined) {
      return []
    }

    const source =
      typeof spec.git === 'string' ? spec.git : typeof spec.url === 'string' ? spec.url : undefined
    const range = typeof spec.version === 'string' ? spec.version : undefined

    return [{ name, range, source, isDev: isDev || spec.optional === true }]
  })
}

/**
 * The declarations of a pyproject.toml: PEP 621 `[project]` (optional extras as dev), PEP 735 dependency groups, uv dev dependencies and Poetry groups.
 *
 * @param toml the parsed file
 */
function pyprojectOf(toml: Record<string, unknown>): Declared[] {
  const project = recordAt(toml, 'project')
  const poetry = recordAt(toml, 'tool', 'poetry')
  const groups = recordAt(poetry, 'group')

  return [
    ...requirementsOf(project.dependencies, false),
    ...Object.values(recordAt(project, 'optional-dependencies')).flatMap(list =>
      requirementsOf(list, true),
    ),
    ...Object.values(recordAt(toml, 'dependency-groups')).flatMap(list =>
      requirementsOf(list, true),
    ),
    ...requirementsOf(recordAt(toml, 'tool', 'uv')['dev-dependencies'], true),
    ...poetryOf(recordAt(poetry, 'dependencies'), false),
    ...poetryOf(recordAt(poetry, 'dev-dependencies'), true),
    ...Object.keys(groups).flatMap(group =>
      poetryOf(recordAt(groups, group, 'dependencies'), true),
    ),
  ]
}

/**
 * The declarations of a requirements file: one per line, options (`-r`, `-e`, `--hash`, ...) and local paths or URLs skipped.
 *
 * @param text the file
 * @param isDev whether its name marks it as a dev file
 */
function requirementsFileOf(text: string, isDev: boolean): Declared[] {
  return text
    .replace(/\\\r?\n/g, ' ')
    .split(/\r?\n/)
    .flatMap(line => {
      const content = line
        .replace(/(?:^|\s)#.*$/, '')
        .replace(/\s--?[a-z-]+(?:[ =]\S+)?/g, '')
        .trim()

      if (
        content === '' ||
        content.startsWith('-') ||
        /^(?:\.{0,2}\/|[a-z+]+:\/\/|git\+)/i.test(content)
      ) {
        return []
      }

      const requirement = pep508Of(content)

      return requirement === undefined ? [] : [{ ...requirement, isDev }]
    })
}

/**
 * The project's own package names from every pyproject.toml read.
 *
 * @param files the files read
 */
function internalOf(files: ProjectFiles): Set<string> {
  return new Set(
    [...files.texts.keys()]
      .filter(path => baseNameOf(path) === 'pyproject.toml')
      .flatMap(path => {
        const toml = parsedFileOf(files, path, parseToml)
        const name = recordAt(toml, 'project').name ?? recordAt(toml, 'tool', 'poetry').name

        return typeof name === 'string' ? [pypiNameOf(name)] : []
      }),
  )
}

/**
 * Python: pyproject.toml (PEP 621, PEP 735 groups, Poetry, uv) and requirements*.txt, versions from uv.lock or poetry.lock, uv workspace members. Names are normalized (PEP 503); extras and environment markers are dropped; optional extras, dependency groups, Poetry groups and requirements files named for dev, test, docs or lint count as dev; the project's own packages and path dependencies are left out.
 */
export const PYTHON_DETECTOR: Detector = {
  isManifest: name => name === 'pyproject.toml' || REQUIREMENTS.test(name),
  isCompanion: name => LOCKFILES.includes(name),
  workspacesOf: files =>
    [...files.texts.keys()].flatMap(path => {
      if (baseNameOf(path) !== 'pyproject.toml') {
        return []
      }

      const workspace = recordAt(parsedFileOf(files, path, parseToml), 'tool', 'uv', 'workspace')
      const include = stringsOf(workspace.members)

      return include.length === 0
        ? []
        : [
            {
              dir: dirOf(path),
              include,
              exclude: stringsOf(workspace.exclude),
              manifest: 'pyproject.toml',
            },
          ]
    }),
  depsOf: (files, manifests) => {
    const internal = internalOf(files)

    return manifests.flatMap(manifest => {
      const file = baseNameOf(manifest)
      const declared =
        file === 'pyproject.toml'
          ? (() => {
              const toml = parsedFileOf(files, manifest, parseToml)

              return toml === undefined ? [] : pyprojectOf(toml)
            })()
          : requirementsFileOf(
              files.texts.get(manifest) ?? '',
              DEV_REQUIREMENTS.test(file.slice(12)),
            )
      const lockfile = nearestFileOf(files.texts, dirOf(manifest), LOCKFILES)
      const locked =
        lockfile === undefined ? undefined : parsedFileOf(files, lockfile, lockVersionsOf)

      return declared.flatMap((entry): Dependency[] => {
        const name = pypiNameOf(entry.name)

        if (internal.has(name)) {
          return []
        }

        return [
          dependencyAt({
            ecosystem: 'pypi',
            name,
            manifestPath: manifest,
            isDev: entry.isDev,
            versionInUse:
              entry.source === undefined
                ? (locked?.get(name) ?? exactVersionOf(entry.range))
                : undefined,
            range: entry.range,
            source: entry.source,
          }),
        ]
      })
    })
  },
}
