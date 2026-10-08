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
 * An item the user saved for later, with when (ms since the epoch).
 */
export type SavedItem = Item & {
  savedAt: number
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
 * The package registry a dependency comes from; Gradle and Maven share `maven`.
 */
export type Ecosystem =
  'npm' | 'pypi' | 'go' | 'cargo' | 'rubygems' | 'packagist' | 'nuget' | 'maven' | 'swift' | 'pub'

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
 * The stack-detection settings of one project.
 */
export type DepsSettings = {
  /** Whether the project's dependencies are followed at all. */
  isEnabled: boolean
  /** Whether dev dependencies are followed too. */
  includeDev: boolean
  /** How many dependencies are followed at most. */
  cap: number
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
export type NewsSettings = Settings

declare module 'claude-code' {
  /**
   * Every value the mod keeps in `$.state`, by key: what the band and pane draw.
   */
  interface PluginState {
    news: {
      sources: Source[]
      settings: NewsSettings
      items: ItemsBySource
      saved: SavedItem[]
      /** One-line summaries by item id, in the current summary language. */
      summaries: Record<string, string>
      band: BandState
      pane: PaneState
      status: RefreshStatus
    }
  }
}
