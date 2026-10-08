import type { DepFeed, Dependency, DepsProject, DepsSettings } from '../../types/index.js'
import { depFeedKeyOf } from '../deps/resolve/dep-feed-key-of.js'
import { ECOSYSTEM_LABELS } from '../deps/stack/ecosystem-labels.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import { cutTo } from '../page/cut-to.js'
import { ECOSYSTEMS } from '../store/ecosystems.js'

/**
 * How many followed packages the listing names; the rest are counted.
 */
const LISTED_MAX = 200

/**
 * Text from the store or a feed as one line of at most `max` characters, `…` marking a cut.
 *
 * @param text the text
 * @param max the most characters
 */
function lineOf(text: string, max: number): string {
  const line = collapsedTextOf(text).trim()

  return line.length > max ? `${cutTo(line, max - 1)}…` : line
}

/**
 * The settings line's parts: on or off, dev dependencies, cap, show and toast levels.
 *
 * @param settings the project's stack settings
 */
function settingsOf(settings: DepsSettings): string {
  return [
    settings.isEnabled ? 'on' : 'off',
    settings.includeDev ? 'dev dependencies included' : 'runtime dependencies only',
    `at most ${settings.cap}`,
    `band and pane show ${settings.showLevel}`,
    settings.toastLevel === 'off' ? 'no toasts' : `toasts at ${settings.toastLevel}`,
  ].join(' · ')
}

/**
 * Where a package's releases come from, as its cached mapping says (no request made): the repository or feed, `(mapped)` for an override, or why there is none.
 *
 * @param entry the package's cached mapping
 */
function statusOf(entry: DepFeed | undefined): string {
  if (entry === undefined) {
    return ': not looked up yet'
  }

  const mapped = entry.isOverride === true ? ' (mapped)' : ''

  if (entry.feed !== undefined) {
    const tags = entry.feed.endsWith('/tags.atom') ? ' (tags)' : ''

    return ` → ${lineOf(entry.repo ?? entry.feed, 100)}${tags}${mapped}`
  }

  if (entry.reason !== undefined) {
    return `: unresolved, ${lineOf(entry.reason, 80)}${mapped}`
  }

  return entry.repo === undefined
    ? ': not looked up yet'
    : ` → ${lineOf(entry.repo, 100)} (mapped, not checked yet)`
}

/**
 * One followed package's line: name, version in use (else the declared range), `(added)` for one added by hand, and its status.
 *
 * @param dependency the package
 * @param feeds the cached mappings by `<ecosystem>:<name>`
 * @param added the keys of the packages added by hand
 */
function packageLineOf(
  dependency: Dependency,
  feeds: Readonly<Record<string, DepFeed>>,
  added: ReadonlySet<string>,
): string {
  const key = depFeedKeyOf(dependency)
  const version = dependency.versionInUse ?? dependency.range
  const entry = Object.hasOwn(feeds, key) ? feeds[key] : undefined

  return [
    `  ${lineOf(dependency.name, 80)}`,
    version === undefined ? '' : ` ${lineOf(version, 30)}`,
    added.has(key) ? ' (added)' : '',
    statusOf(entry),
  ].join('')
}

/**
 * `/news deps` as text: the project and its stack settings, the counts, each followed package grouped by ecosystem with its version and where its releases come from (resolved, unresolved with the reason, or not looked up yet, from the cache only), then the ignored packages.
 *
 * @param at the project root and whether it is a git repository
 * @param project its stack record
 * @param feeds the cached mappings by `<ecosystem>:<name>`
 */
export function depsTextOf(
  at: { readonly root: string; readonly isRepo: boolean },
  project: DepsProject,
  feeds: Readonly<Record<string, DepFeed>>,
): string {
  const { settings, dependencies } = project
  const ignored = project.ignored ?? []
  const added = new Set((project.added ?? []).map(depFeedKeyOf))
  const head = [
    `Your stack in ${at.root}: ${settingsOf(settings)}`,
    ...(at.isRepo ? [] : ['Not in a git repository: only the manifests in this folder are read.']),
    ...(settings.isEnabled
      ? []
      : [`Nothing is followed or fetched while it is off; /${COMMAND_NAME} deps on turns it on.`]),
  ]
  const counts = [
    `${project.detectedCount} detected`,
    `${dependencies.length} followed`,
    ...(added.size === 0 ? [] : [`${added.size} added`]),
    ...(ignored.length === 0 ? [] : [`${ignored.length} ignored`]),
  ].join(' · ')
  const listed = dependencies.slice(0, LISTED_MAX)
  const groups = ECOSYSTEMS.flatMap(ecosystem => {
    const members = listed.filter(dependency => dependency.ecosystem === ecosystem)

    return members.length === 0
      ? []
      : [
          `${ECOSYSTEM_LABELS[ecosystem]} (${members.length})`,
          ...members.map(dependency => packageLineOf(dependency, feeds, added)),
        ]
  })
  const body =
    dependencies.length === 0
      ? [
          project.detectedAt === 0 && settings.isEnabled
            ? `Not detected yet; /${COMMAND_NAME} deps rescan detects it now.`
            : 'No dependency is followed.',
        ]
      : [
          ...groups,
          ...(dependencies.length > LISTED_MAX
            ? [`… and ${dependencies.length - LISTED_MAX} more`]
            : []),
        ]

  return [
    ...head,
    counts,
    '',
    ...body,
    ...(ignored.length === 0
      ? []
      : ['', `Ignored: ${ignored.map(key => lineOf(key, 80)).join(', ')}`]),
    '',
    `/${COMMAND_NAME} deps help lists what you can change.`,
  ].join('\n')
}
