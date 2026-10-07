import type { Dependency } from '../../../types/index.js'
import { dependencyAt } from './dependency-at.js'
import type { Detector } from './detector.js'
import { dirOf } from './dir-of.js'
import { exactVersionOf } from './exact-version-of.js'
import { nearestFileOf } from './nearest-file-of.js'
import { parsedFileOf } from './parsed-file-of.js'

/**
 * The Bundler groups that only development and tests install.
 */
const DEV_GROUPS = new Set(['development', 'test'])

/**
 * One `gem` line: name, requirements, and whether it is dev, local or from git.
 */
type Gem = {
  name: string
  requirements: string[]
  isDev: boolean
  isLocal: boolean
  source?: string
}

/**
 * The symbols a `group`/`groups:` argument names (`:test`, `[:development, :test]`, `'test'`).
 *
 * @param text the argument text
 */
function groupsIn(text: string): string[] {
  return [...text.matchAll(/:(\w+)|['"](\w+)['"]/g)].map(match => match[1] ?? match[2] ?? '')
}

/**
 * Whether a set of groups only installs for development (or is optional).
 *
 * @param groups the group names
 * @param isOptional whether the group is `optional: true`
 */
function isDevGroup(groups: readonly string[], isOptional: boolean): boolean {
  return isOptional || (groups.length > 0 && groups.every(group => DEV_GROUPS.has(group)))
}

/**
 * Reads a Gemfile's `gem` lines, tracking `group ... do` blocks; throws when a block is left open.
 *
 * @param text the Gemfile
 */
function gemsOf(text: string): Gem[] {
  const blocks: { isDev: boolean }[] = []
  const gems: Gem[] = []

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/(?:^|\s)#.*$/, '').trim()
    const group = /^group\s+(.*?)\s+do\b/.exec(line)
    const gem = /^gem\s*\(?\s*(['"])([^'"]+)\1(.*)$/.exec(line)

    if (group !== null) {
      blocks.push({
        isDev: isDevGroup(
          groupsIn(group[1]?.replace(/\w+:\s*\S+/g, '') ?? ''),
          /optional:\s*true/.test(group[1] ?? ''),
        ),
      })
    } else if (
      /\bdo\s*(?:\|[^|]*\|)?$/.test(line) ||
      /^(?:if|unless|case|begin|while|until)\b/.test(line)
    ) {
      blocks.push({ isDev: false })
    } else if (/^end\b/.test(line)) {
      blocks.pop()
    } else if (gem !== null) {
      const rest = gem[3] ?? ''
      const options = rest.slice(
        rest.search(/\w+:\s|:\w+\s*=>/) >= 0 ? rest.search(/\w+:\s|:\w+\s*=>/) : rest.length,
      )
      const requirements = [
        ...rest.slice(0, rest.length - options.length).matchAll(/['"]([^'"]+)['"]/g),
      ].map(match => match[1] ?? '')
      const inline = /\bgroups?:\s*(\[[^\]]*\]|:\w+|['"]\w+['"])/.exec(options)
      const git = /\b(git|github):\s*['"]([^'"]+)['"]/.exec(options)

      gems.push({
        name: gem[2] ?? '',
        requirements,
        isDev:
          blocks.some(block => block.isDev) ||
          (inline !== null && isDevGroup(groupsIn(inline[1] ?? ''), false)),
        isLocal: /\bpath:\s/.test(options),
        ...(git === null
          ? {}
          : {
              source: git[1] === 'github' ? `https://github.com/${git[2] ?? ''}` : (git[2] ?? ''),
            }),
      })
    }
  }

  if (blocks.length > 0) {
    throw new Error('a block is never closed')
  }

  return gems
}

/**
 * The versions a Gemfile.lock pins, by gem name, platform suffixes dropped; throws when it has no specs.
 *
 * @param text the lockfile
 */
function lockVersionsOf(text: string): Map<string, string> {
  const versions = new Map<string, string>()

  for (const match of text.matchAll(/^ {4}([^\s(]+) \(([^)]+)\)\s*$/gm)) {
    const version = (match[2] ?? '').replace(/-(?=[A-Za-z_]).*$/, '')

    versions.set(match[1] ?? '', version)
  }

  if (versions.size === 0 && !/^\s*specs:\s*$/m.test(text)) {
    throw new Error('no specs')
  }

  return versions
}

/**
 * Ruby: Gemfile `gem` lines, groups `development` and `test` (and optional groups) as dev, versions from Gemfile.lock; `path:` gems are left out, `git:`/`github:` gems keep their repository.
 */
export const RUBY_DETECTOR: Detector = {
  isManifest: name => name === 'Gemfile',
  isCompanion: name => name === 'Gemfile.lock',
  workspacesOf: () => [],
  depsOf: (files, manifests) =>
    manifests.flatMap(manifest => {
      const gems = parsedFileOf(files, manifest, gemsOf) ?? []
      const lockfile = nearestFileOf(files.texts, dirOf(manifest), ['Gemfile.lock'])
      const locked =
        lockfile === undefined ? undefined : parsedFileOf(files, lockfile, lockVersionsOf)

      return gems
        .filter(gem => !gem.isLocal)
        .map((gem): Dependency =>
          dependencyAt({
            ecosystem: 'rubygems',
            name: gem.name,
            manifestPath: manifest,
            isDev: gem.isDev,
            versionInUse:
              locked?.get(gem.name) ??
              (gem.requirements.length === 1 && gem.source === undefined
                ? exactVersionOf(gem.requirements[0])
                : undefined),
            range: gem.requirements.join(', '),
            source: gem.source,
          }),
        )
    }),
}
