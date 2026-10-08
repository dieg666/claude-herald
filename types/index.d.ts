/**
 * How a source is read: an RSS/Atom `feed`, or a web `page` a model extracts items from.
 */
export type SourceKind = 'feed' | 'page'

/**
 * One place news comes from, factory or user-added.
 */
export type Source = {
  /** Stable id, unique among sources; prefixes the ids of its items. */
  id: string
  /** What the band, pane and commands call it. */
  name: string
  /** The feed or page URL. */
  url: string
  kind: SourceKind
  /** Disabled sources are kept but never fetched or shown. */
  isEnabled: boolean
  /** A single-width text glyph drawn before its headlines. */
  icon: string
  /** Fetched when `url` fails. */
  fallbackUrl?: string
  /** Whether it came with the mod (restored by a reset). */
  isFactory: boolean
}

/**
 * One news entry, as the band and pane draw it.
 */
export type Item = {
  /** `<sourceId>:<guid, id, link or title hash>`, unique across sources. */
  id: string
  sourceId: string
  title: string
  url: string
  /** ISO 8601, absent when the source gives no usable date. */
  publishedAt?: string
  /** A capped plain-text excerpt, what summaries read. */
  text: string
  /** The language the source declares for it, when it does. */
  lang?: string
}

/**
 * An item the user saved for later, with when (ms since the epoch), and its release when it is a stack item.
 */
export type SavedItem = Item & {
  savedAt: number
  release?: StackRelease
}

/**
 * The summary language: the item's own (`feed`), Claude Code's `language` setting (`user`), or a fixed code.
 */
export type SummaryLang = 'feed' | 'user' | (string & {})

/**
 * Which summary: the one-line band/pane line, or the 3-5 line Summarize text.
 */
export type SummaryKind = 'short' | 'long'

/**
 * One cached summary; the cache is a list of these, oldest first.
 */
export type SummaryEntry = {
  itemId: string
  /** The resolved language the text is in (never `user`). */
  lang: string
  kind: SummaryKind
  /** The version of the prompts that wrote it; 0 for an entry from before versions. */
  version: number
  text: string
}

/**
 * The user's settings; a stored partial object is completed with the defaults.
 */
export type Settings = {
  /** Minutes between refreshes. */
  refreshMinutes: number
  /** Seconds between band rotations. */
  rotateSeconds: number
  lang: SummaryLang
  /** The copy-for-Claude text, with `{title}`, `{url}` and `{source}` placeholders. */
  template: string
  /** The copy-for-Claude text of a dependency release, with `{pkg}`, `{current}`, `{new}` and `{url}` placeholders. */
  depsTemplate: string
}

/**
 * Items by source id, newest first.
 */
export type ItemsBySource = Record<string, Item[]>

/**
 * The band's page and selection.
 */
export type BandState = {
  /** Index of the first item shown in the flattened list. */
  offset: number
  /** Index of the selected item within the shown page. */
  selected: number
  /** Whether auto-rotation is paused. */
  isPaused: boolean
}

/**
 * The pane's active tab (a source id or `saved`) and its selected row.
 */
export type PaneState = {
  tab: string
  selected: number
}

/**
 * What the refresh loop last did.
 */
export type RefreshStatus = {
  /** When the last refresh run ended (ms since the epoch), null before the first. */
  lastRefreshAt: number | null
  /** Whether a refresh run is in progress. */
  isRefreshing: boolean
  /** The last failure per source id; absent once the source refreshes cleanly. */
  errors: Record<string, string>
}

/**
 * The package registry a dependency comes from; Gradle and Maven share `maven`; `github` is a repository followed by hand, named `owner/repo`.
 */
export type Ecosystem =
  | 'npm'
  | 'pypi'
  | 'go'
  | 'cargo'
  | 'rubygems'
  | 'packagist'
  | 'nuget'
  | 'maven'
  | 'swift'
  | 'pub'
  | 'github'

/**
 * One dependency a project's manifests declare.
 */
export type Dependency = {
  ecosystem: Ecosystem
  /** The registry name: `group:artifact` for Maven, the module path for Go, the URL's last part for Swift. */
  name: string
  /** The version the lockfile pins, or the manifest's when it names one exact version. */
  versionInUse?: string
  /** The version requirement as the manifest writes it (Swift `from:` as `^x`, `upToNextMinor` as `~x`). */
  range?: string
  /** Not installed by default: dev, test, docs or build-only groups and optional extras. */
  isDev: boolean
  /** Declared by a manifest at the project root. */
  isRoot: boolean
  /** The declaring manifest, relative to the project root, `/`-separated. */
  manifestPath: string
  /** The repository URL when the manifest names one instead of a registry (Swift, git dependencies). */
  source?: string
}

/**
 * Which dependency releases a view shows: every one, minor and up, major and up, or only breaking and security ones; past `all`, a pre-release never passes, flagged or not, and any other breaking or security release passes every level.
 */
export type DepsLevel = 'all' | 'minor+' | 'major+breaking+security' | 'breaking+security'

/**
 * Which new dependency releases raise a toast: a show level, or none.
 */
export type DepsToastLevel = DepsLevel | 'off'

/**
 * The stack settings of one project.
 */
export type DepsSettings = {
  /** Whether the project's dependencies are followed at all. */
  isEnabled: boolean
  /** Whether dev dependencies are followed too. */
  includeDev: boolean
  /** How many dependencies are followed at most. */
  cap: number
  /** Which releases the band and the pane show. */
  showLevel: DepsLevel
  /** Which new releases raise a toast. */
  toastLevel: DepsToastLevel
}

/**
 * What the store keeps for one project, keyed by its root path.
 */
export type DepsProject = {
  settings: DepsSettings
  /** The followed dependencies, runtime and root-declared first, at most `settings.cap`. */
  dependencies: Dependency[]
  /** How many distinct dependencies the last detection found, before the dev filter and the cap. */
  detectedCount: number
  /** The content hash of each manifest and lockfile the last detection read (`size:<bytes>` for one too large to read), by path relative to the root. */
  manifestHashes: Record<string, string>
  /** When the last detection ran, in milliseconds since the epoch; 0 for a project never detected. */
  detectedAt: number
  /** The packages the user ignored, `<ecosystem>:<name>`: never followed, resolved or shown; absent when none. */
  ignored?: string[]
  /** The packages the user follows without a manifest declaring them, in the order added; absent when none. */
  added?: Dependency[]
}

/**
 * Where a package's releases are read, as cached under `<ecosystem>:<name>`: a feed, or why there is none; an override with only `repo` is not checked yet.
 */
export type DepFeed = {
  /** The GitHub repository, `owner/repo`. */
  repo?: string
  /** The release feed URL. */
  feed?: string
  /** Why the package has no feed, for a negative result. */
  reason?: string
  /** When it was resolved or set, in milliseconds since the epoch. */
  resolvedAt: number
  /** Set by the user: wins over lookups and is never dropped by the cache's age or size limits. */
  isOverride?: boolean
}

/**
 * One dependency's release feed, or why it has none.
 */
export type DepResolution = {
  dependency: Dependency
  status: 'resolved' | 'unresolved'
  /** The GitHub repository, `owner/repo`, when one was found. */
  repo?: string
  /** The release feed URL, set exactly when resolved. */
  feed?: string
  /** Why it is unresolved. */
  reason?: string
  /** Whether a user override decided it. */
  isOverride: boolean
}

/**
 * The mod's Settings under a name claude-code does not use: inside its module block, `Settings` is claude-code's own.
 */
export type HeraldSettings = Settings

/**
 * Whether a release breaks code that uses the package, and whether it fixes a security issue.
 */
export type ReleaseFlags = {
  breaking: boolean
  security: boolean
}

/**
 * The model's verdict on one release's notes, cached by release id; the cache is a list of these, oldest first.
 */
export type ReleaseFlagsEntry = ReleaseFlags & {
  /** `<ecosystem>:<name>|<entry guid, link or title>`. */
  releaseId: string
  /** How many malformed answers the model gave instead of a verdict; when set, the flags are the keyword ones. */
  malformed?: number
}

/**
 * What a stack item says about its release: the package, the versions, how far apart they are, and the flags.
 */
export type StackRelease = {
  /** `<ecosystem>:<name>|<entry guid, link or title>`, what the model's flags are cached under. */
  releaseId: string
  ecosystem: Ecosystem
  /** The package's registry name. */
  name: string
  /** The version in use, or the floor of the declared range. */
  current?: string
  /** The version the release names. */
  version?: string
  /** Which release part changed from the version in use, `unknown` when they cannot be compared. */
  level: 'patch' | 'minor' | 'major' | 'unknown'
  isPrerelease: boolean
  breaking: boolean
  security: boolean
}

/**
 * A release of a followed dependency as the band, the pane and the toasts show it: an item of the stack, with its release.
 */
export type StackItem = Item & {
  release: StackRelease
}

/**
 * What the store keeps for one followed dependency's releases.
 */
export type StackDep = {
  /** When its feed was last read, in milliseconds since the epoch. */
  checkedAt: number
  /** The version its releases were classified against. */
  current?: string
  /** The release ids already seen, newest first; present once its feed has loaded. */
  seen: string[]
  /** The newest releases above the version in use, newest first. */
  items: StackItem[]
}

/**
 * What the store keeps for one project's stack releases, keyed by its root path.
 */
export type StackProject = {
  /** By `<ecosystem>:<name>`. */
  deps: Record<string, StackDep>
  /** When the last refresh wrote it, in milliseconds since the epoch. */
  refreshedAt: number
}

/**
 * The stack as the band and the pane draw it: the project, its settings, its releases, the pane's filter and the packages it shows expanded.
 */
export type StackState = {
  /** The project root the releases belong to; null before the first look. */
  root: string | null
  settings: DepsSettings
  /** Every kept release of the followed dependencies, newest first. */
  items: StackItem[]
  /** The text the pane's stack tab filters by. */
  filter: string
  /** The packages whose releases the pane's stack tab lists under them, `<ecosystem>:<name>`; absent when none. */
  expanded?: string[]
}

declare module 'claude-code' {
  /**
   * Every value the mod keeps in `$.state`, by key: what the band and pane draw.
   */
  interface PluginState {
    herald: {
      sources: Source[]
      settings: HeraldSettings
      items: ItemsBySource
      saved: SavedItem[]
      /** One-line summaries by item id, in the current summary language; an empty text means none is shown for now. */
      summaries: Record<string, string>
      band: BandState
      pane: PaneState
      status: RefreshStatus
      stack: StackState
    }
  }
}
