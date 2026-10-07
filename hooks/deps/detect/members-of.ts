import { childPathOf } from './child-path-of.js'
import { isSkippedDir } from './is-skipped-dir.js'
import type { Lister } from './lister.js'
import { memberPatternOf } from './member-pattern-of.js'
import { pathMatches } from './path-matches.js'
import { segmentMatches } from './segment-matches.js'
import type { Workspace } from './workspace.js'

/**
 * The directories one pattern reaches below a directory, through real directories only: no links, no skipped names.
 *
 * @param list the detection's Lister
 * @param dir where the pattern starts, relative to the root
 * @param segments the pattern's segments left
 * @param depth how many more levels a `**` may descend
 */
async function expand(
  list: Lister,
  dir: string,
  segments: readonly string[],
  depth: number,
): Promise<string[]> {
  const [segment, ...rest] = segments

  if (segment === undefined) {
    return [dir]
  }

  const children = ((await list(dir)) ?? []).filter(
    entry => entry.kind === 'dir' && !entry.isLink && !isSkippedDir(entry.name),
  )

  if (segment === '**') {
    const here = await expand(list, dir, rest, depth)

    if (depth <= 0) {
      return here
    }

    const below = await Promise.all(
      children.map(child => expand(list, childPathOf(dir, child.name), segments, depth - 1)),
    )

    return [...here, ...below.flat()]
  }

  const matched = children.filter(child => segmentMatches(child.name, segment))
  const reached = await Promise.all(
    matched.map(child => expand(list, childPathOf(dir, child.name), rest, depth)),
  )

  return reached.flat()
}

/**
 * The member manifests of a workspace: each directory its patterns reach, inside the project and through real directories only, that holds the member manifest as a regular file.
 *
 * @param workspace the declared workspace
 * @param list the detection's Lister
 * @param maxDepth how many levels a `**` may descend
 * @param debug one line in the debug log
 * @returns each member manifest's size by path relative to the root
 */
export async function membersOf(
  workspace: Workspace,
  list: Lister,
  maxDepth: number,
  debug: (text: string) => void,
): Promise<Map<string, number>> {
  const excludes = workspace.exclude.flatMap(pattern => {
    const segments = memberPatternOf(pattern)

    return segments === undefined ? [] : [segments]
  })
  const dirs = new Set<string>()

  for (const pattern of workspace.include) {
    const segments = memberPatternOf(pattern)

    if (segments === undefined) {
      debug(`skipped workspace member '${pattern}' of ${workspace.dir || '.'}: outside the project`)
    } else {
      for (const dir of await expand(list, workspace.dir, segments, maxDepth)) {
        dirs.add(dir)
      }
    }
  }

  const members = new Map<string, number>()
  const prefix = workspace.dir === '' ? 0 : workspace.dir.length + 1

  for (const dir of dirs) {
    const relative = dir.slice(prefix).split('/').filter(Boolean)
    const manifest = (await list(dir))?.find(
      entry => entry.name === workspace.manifest && entry.kind === 'file' && !entry.isLink,
    )

    if (manifest !== undefined && !excludes.some(pattern => pathMatches(relative, pattern))) {
      members.set(childPathOf(dir, workspace.manifest), manifest.size)
    }
  }

  return members
}
