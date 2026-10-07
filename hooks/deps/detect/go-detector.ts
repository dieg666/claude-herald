import { baseNameOf } from './base-name-of.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { goDirectivesOf } from './go-directives-of.js'
import { parsedFileOf } from './parsed-file-of.js'

/**
 * A go.mod as the detector reads it.
 */
type GoMod = {
  module: string | undefined
  requires: { path: string; version: string }[]
  localReplaces: Set<string>
}

/**
 * A word of a directive without its quotes.
 *
 * @param word a module path or version, maybe quoted
 */
function unquoted(word: string): string {
  return word.replace(/^["`](.*)["`]$/, '$1')
}

/**
 * Reads a go.mod: the module path, the direct requirements (`// indirect` left out) and the modules replaced by a local directory; throws on a broken file.
 *
 * @param text the file
 */
function goModOf(text: string): GoMod {
  const directives = goDirectivesOf(text)
  const module = directives.find(directive => directive.verb === 'module')?.line
  const requires = directives.flatMap(({ verb, line }) => {
    const [path, version] = line
      .replace(/\/\/.*$/, '')
      .trim()
      .split(/\s+/)

    return verb === 'require' && !/\/\/\s*indirect\b/.test(line) && path && version
      ? [{ path: unquoted(path), version: unquoted(version) }]
      : []
  })
  const localReplaces = new Set(
    directives.flatMap(({ verb, line }) => {
      const [from, to] = line.replace(/\/\/.*$/, '').split('=>')
      const target = to?.trim() ?? ''

      return verb === 'replace' && /^(?:\.{1,2}[\\/]|[\\/])/.test(target)
        ? [unquoted(from?.trim().split(/\s+/)[0] ?? '')]
        : []
    }),
  )

  if (module === undefined) {
    throw new Error('no module directive')
  }

  return { module: unquoted(module.replace(/\/\/.*$/, '').trim()), requires, localReplaces }
}

/**
 * Go: go.mod direct requirements (the version is the one in use), go.work `use` members; indirect requirements, the project's own modules and modules replaced by a local directory are left out.
 */
export const GO_DETECTOR: Detector = {
  isManifest: name => name === 'go.mod',
  isCompanion: name => name === 'go.work',
  workspacesOf: files =>
    [...files.texts.keys()].flatMap(path => {
      if (baseNameOf(path) !== 'go.work') {
        return []
      }

      const directives = parsedFileOf(files, path, goDirectivesOf) ?? []
      const include = directives.flatMap(({ verb, line }) =>
        verb === 'use' ? [unquoted(line.replace(/\/\/.*$/, '').trim())] : [],
      )

      return include.length === 0
        ? []
        : [{ dir: dirOf(path), include, exclude: [], manifest: 'go.mod' }]
    }),
  depsOf: (files, manifests) => {
    const mods = [...files.texts.keys()]
      .filter(path => baseNameOf(path) === 'go.mod')
      .flatMap(path => {
        const mod = parsedFileOf(files, path, goModOf)

        return mod === undefined ? [] : [[path, mod] as const]
      })
    const internal = new Set(mods.flatMap(([, mod]) => [mod.module ?? '', ...mod.localReplaces]))
    const byPath = new Map(mods)

    return manifests.flatMap(manifest =>
      (byPath.get(manifest)?.requires ?? [])
        .filter(require => !internal.has(require.path))
        .map(require =>
          dependencyAt({
            ecosystem: 'go',
            name: require.path,
            manifestPath: manifest,
            isDev: false,
            versionInUse: require.version,
            range: require.version,
          }),
        ),
    )
  },
}
