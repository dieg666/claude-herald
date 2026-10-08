# Your stack

The mod follows the releases of the packages your project depends on. It reads the project's manifests and lockfiles, finds each package's GitHub repository through its registry, reads the repository's release feed on the refresh timer, and shows releases newer than your version in the band and the pane. Settings, followed packages and releases are kept per project.

The project is the closest directory at or above the session's directory that holds `.git`, never your home directory or one above it. Without a `.git` it is the session's directory alone. At a filesystem root there is no project, and `/herald deps` says so. For a session started in or outside your home directory, see [Files stack detection reads](security.md#files-stack-detection-reads).

## What the mod follows

The mod detects the stack a moment after the session starts, on `/herald deps rescan`, after a command that changes what is followed, and on the refresh timer when a manifest or lockfile it read has changed. The timer re-reads only the files it read before, so a manifest added somewhere new waits for the next session or a rescan. The ecosystems are npm, Python, Go, Rust, Ruby, PHP, .NET, Java, Swift and Dart. The file names, the skipped directories and the walk limits are in [Files stack detection reads](security.md#files-stack-detection-reads).

- **One entry per package.** A package that several manifests declare is followed once per ecosystem and name, from its runtime, root-declared declaration first.
- **Version in use.** The version a lockfile pins, else the manifest's exact version, else the lowest version the declared range allows. Releases at or below it are hidden.
- **Dev dependencies.** Left out until you run `/herald deps dev on`. A dev dependency is one the manifest marks as not installed by default. In npm that is `devDependencies`. In Python it is `[project.optional-dependencies]`, `[dependency-groups]`, uv `dev-dependencies`, every Poetry group, Poetry `dev-dependencies` and optional Poetry dependencies, and requirements files named for development (`requirements-dev.txt`: the name holds dev, develop, test, tests, testing, lint, doc, docs, ci, typing, types, check or bench).
- **Cap.** At most 50 packages (`/herald deps cap`, 1 to 500). Over the cap, runtime dependencies come before dev ones, and root-declared before the rest.
- **Added and ignored.** A package you add with `/herald deps add` is followed first, counts toward the cap and is not read from any file. A package you ignore is never followed.

## How a package finds its releases

1. A GitHub address in the manifest (a git dependency, a Swift package URL) names the repository.
2. Otherwise the package's registry does ([Network hosts](security.md#network-hosts)). A Go module under `github.com/` or `golang.org/x/` needs no request. Swift and Dart (pub) have no registry lookup.
3. The mod reads `https://github.com/OWNER/REPO/releases.atom`, or `tags.atom` when the repository publishes no releases.

A package is unresolved when its repository is not on GitHub, its registry does not know it, its name is not valid for that registry or it has no lookup. `/herald deps` lists it with the reason, and nothing shows for it. A mapping, an unresolved one included, is kept for 7 days. A failed request is not kept: `/herald deps` shows that package as `not looked up yet` (or with its older mapping), the failure goes to the debug log only, and the mod waits an hour before it tries again.

`/herald deps map` sets where a package's releases are read, in every project, and the mapping never expires. To replace it, run `map` again; `/herald deps map <package> off` removes it, so the package is looked up in its registry again. `/herald reset` does not clear it. `/herald deps add owner/repo` follows a repository as the `github` ecosystem: no registry lookup, every tag counts as a release, and with no version in use every level is `unknown`. For any other package, a release whose tag names another package of the repository (`other@1.2.0`) is skipped.

## How a release is classified

The mod takes a release's version from its GitHub tag, else its title, and compares it with yours. The release level is `patch`, `minor` or `major`, from the first part of the version that differs. Below 1.0 the first non-zero part is the boundary, as in caret ranges, so `0.3.1` to `0.4.0` is `major` without being flagged breaking. The level is `unknown` when either version cannot be compared, for example when nothing pins a version and the range has no lower bound. A pre-release such as `2.0.0-rc.1` keeps its level and is marked `pre-release`.

Each release also gets a `breaking` and a `security` flag. Keywords set them first: "breaking" as a whole word, not right after "no", "non", "not" or "without"; an advisory id; the words "security" and "vulnerability". Then Haiku reads the notes and answers breaking and security, and its answer replaces the keyword flags, except that an advisory id in the title or notes always sets `security`. When Haiku gives no usable answer, the keyword flags stand.

## Show and toast levels

`/herald deps level` sets which releases the band and the pane show, and `/herald deps toast` sets which new releases raise a toast. A release's level describes the release; the show and toast levels are your settings, and a release appears where its level and flags pass them.

| Level | Passes |
|-------|--------|
| `all` | Every release above your version, pre-releases included. |
| `minor+` | Minor, major and `unknown` releases. The show default. |
| `major+breaking+security` | Major releases. |
| `breaking+security` | Only flagged releases. The toast default. |
| `off` | Nothing. A toast setting only. |

A flagged release passes every level but `off`, unless it is a pre-release; a pre-release passes `all` only. A `0.x` minor release is level `major`, so it passes `major+breaking+security`.

The first time the mod reads a package's feed, it shows the releases above your version, but the refresh run raises no toast and makes no release check for them; only releases that appear afterwards are new. The rows shown still get the check when a view draws them. Mapping a package to another feed starts it over.

## What you see

- **Band, All and Saved rows.** `📦 pkg current → new`, then ` · title` when the title says more than the version; `⚠` replaces `📦` on a flagged release. In the band and on All a package is one row, whatever number of its releases are shown: `new` is its target, the highest stable version shown, with the target's date, the same as on the Your stack tab; `⚠` also marks a package whose target is not flagged but another release shown is, and the note then names it, `npm · major · breaking in 4.6.3 · 5 releases`. Open and Copy act on the target release. Saved rows keep the release you saved. A second line shows the ecosystem, the level when known, `pre-release` and the flags, for example `npm · major · breaking`; in the band with automatic summaries off, they follow the headline on its one line, dim, as far as the width allows. A row has a flag check and no Haiku summary.
- **Your stack tab.** Press `y` in the pane. Packages are grouped by ecosystem, one row each, in aligned columns: `⚠  jsdom  25.0.1 → 30.1.2  major  breaking in 30.0.0 · 3 releases  Oct 5`. The row shows the version in use, the highest release shown (the highest stable version, a pre-release only when no stable one is shown, so a later backport such as `7.0.3` after `8.0.0` does not replace it), the highest level among the releases shown, each flag with the release that brought it (just `security` when that is the highest), `pre-release` when the highest is one, how many releases are shown when more than one, and the highest one's date, or its age while it is less than a day old, right-aligned at the pane's edge like the date on the other tabs. Only the part of the new version that changed is colored, by that release's own level: red for major (a `0.x` minor is major), yellow for minor, green for patch, none for `unknown`. The selected row is highlighted whole and shows that part in bold instead of in color. `⚠` marks a package with any flagged release shown, `📦` the others. Inside each ecosystem, packages with a flagged release come first, then major, minor, patch and `unknown`, then by the date shown, newest first. A line under the title line counts the packages at the show level, the same number the tab shows, before the filter: `6 packages behind · 2 security · 1 breaking`, leaving out counts of zero. Press `e` to list the selected package's releases under it, indented, one line each with its level, flags and date, and `e` again to hide them; the expanded packages last for the session, like the filter. Every release of the packages in view gets the flag check. The filter field, labelled `Filter (click or Tab)`, gets the keys once you click it or Tab to it. It takes words, up to 100 characters, that must all appear in the package name, ecosystem, level (the package's highest) or a flag of any of its releases shown. Where the surface has no text field (mobile), the filter in force shows as a dim `Filter: …` line, and `/herald deps filter <text>` sets it. The filter lives in session state only: a new session, `/clear`, `/resume`, `/branch` and a change of project start without it.
- **Toast.** One toast per refresh names the new releases at the toast level, flagged ones first: `2 releases: lodash 4.17.20 → 5.0.0 ⚠, zod 3.22.0 → 3.23.0`. With three or more it names the first: `3 releases: lodash 4.17.20 → 5.0.0 ⚠ …`.
- **Nothing drawn.** `/herald deps` lists the followed packages and where their releases come from, not the releases.

## Limits per refresh

The stack refreshes after every source refresh, on the same timer.

| Bound | Value |
|-------|-------|
| Registry lookups | 10 per run, 2 at a time. The rest wait for the next run. |
| Release feeds read | 10 per run, the least recently read first, 2 at a time. A feed is read again after 1 hour, or when your version changed. |
| Release checks by Haiku | 12 per run, 2 model calls at a time. For every model call, see [Haiku calls and cost](reference.md#haiku-calls-and-cost). |
| Request deadline | 30 seconds per registry or feed request. A request that takes longer counts as a failure. |
| Retries | 3 after a 429 or 5xx answer, after 1, 2 and 4 seconds. The mod does not read `Retry-After`. |
| Pause after a failure | 1 hour for a package's lookup, a feed, or a release's check. A new session starts without it. |
| Releases kept | 5 per package and 100 per project, newest first. |

## Commands for your stack

`/herald deps` acts on the project you are in. A package is `<ecosystem>:<name>`, such as `npm:zod`, or its bare name when only one package has it. The ecosystems are `npm`, `pypi`, `go`, `cargo`, `rubygems`, `packagist`, `nuget`, `maven` (as `group:artifact`), `swift`, `pub` and `github`; aliases such as `python`, `rust` and `dart` work. A level is read in any case, ignoring spaces.

| Subcommand | Argument | What it does | Example |
|------------|----------|--------------|---------|
| `/herald deps` | none | Lists the project root, its settings, the counts, and each followed package by ecosystem with its version, `(added)` if you added it, and where its releases come from (a repository, `(tags)`, `(mapped)`, `unresolved` with the reason, or not looked up yet), then the ignored packages. It reads the store, makes no request, and names the first 200 packages. | `/herald deps` |
| `help` | none | Lists the subcommands. A wrong or missing argument replies with the reason and the usage and changes nothing. | `/herald deps help` |
| `on`, `off` | none | Turns the stack on or off for this project. While off, the mod makes no request, shows no release and raises no toast; other sources stay. A request or Haiku call already in flight when you run `off` finishes, and its result is stored but not shown. `on` detects the stack again. | `/herald deps off` |
| `rescan` | none | Detects the stack again and refreshes its releases. Refused while the stack is off. | `/herald deps rescan` |
| `ignore <package>` | A package the project follows or has added | Stops following, looking up and showing it. Refused for any other package. | `/herald deps ignore npm:left-pad` |
| `unignore <package>` | An ignored package | Follows it again when a manifest declares it or you added it. | `/herald deps unignore left-pad` |
| `add <ecosystem:package\|owner/repo>` | A package, or a GitHub repository as `owner/repo`, `github:owner/repo` or its address | Follows a package no manifest declares, or a repository as the `github` ecosystem, and takes it off the ignored list. Refused when it is followed already, or at 500 added packages. | `/herald deps add vercel/next.js` |
| `map <package> <owner/repo\|feed-url\|off>` | A followed, added or ignored package, then a repository or feed address, or `off` | Reads the package's releases from that repository or feed, replacing any earlier mapping, and drops the releases kept from the old feed. `off` removes your mapping (in every project) and drops this project's kept releases of the package; it is refused when the package has no mapping you set. | `/herald deps map npm:lodash lodash/lodash`, `/herald deps map npm:lodash off` |
| `dev <on\|off>` | `on` or `off` | Follows dev dependencies too, default off. | `/herald deps dev on` |
| `level <level>` | `all`, `minor+`, `major+breaking+security` or `breaking+security` | Sets what the band and the pane show, default `minor+`. | `/herald deps level major+breaking+security` |
| `toast <level\|off>` | A level or `off` | Sets which new releases raise a toast, default `breaking+security`. | `/herald deps toast off` |
| `cap <1-500>` | A whole number | Follows at most that many packages, default 50. | `/herald deps cap 100` |
| `template <text>` | Text with `{pkg}`, `{current}`, `{new}` and `{url}` | Sets the release template for every project. | `/herald deps template Is {pkg} {new} safe? {url}` |
| `filter [text]` | Words, or nothing | Sets the Your stack tab's filter; nothing clears it. | `/herald deps filter breaking` |

`dev`, `cap`, `ignore`, `unignore` and `add` detect the stack again and start a refresh only while the stack is on. `map` starts one only when the package is followed and the stack is on. `rescan` is refused while the stack is off.
