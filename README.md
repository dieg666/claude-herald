# Herald

Herald: news and releases for your stack, right above the prompt.

A Claude Code mod that keeps you up to date on Claude and the tools around it without leaving the terminal. A band above the prompt rotates the latest items from RSS/Atom feeds, web pages and the new releases of the packages your project depends on, each with a headline link and a one-line Haiku summary. `/herald` opens a pane with a tab per source, a Your stack tab and a Saved tab. On the selected item you can open it, show a longer summary, save it for later and copy it for Claude. Factory sources (Anthropic news, release feeds of Claude Code and the SDKs, Hacker News and more) can be disabled or removed, and you can add your own. Every command also answers with text, so it works where nothing is drawn.

## Requirements

- Claude Code 2.1.287 or later. Tested with Claude Code 2.1.293.
- A terminal or the Desktop app to draw the band and the pane. In other places, such as `claude -p`, VS Code and cloud sessions, `/herald` answers with the latest items as text and `/herald deps` lists your stack as text.
- A session that can call a model. Summaries and release checks use Haiku through your plan or API key (see [Cost](#cost)).

## Terms

| Term | Meaning |
|------|---------|
| Mod | A plugin that changes how Claude Code looks and behaves. This repository is one plugin, named `herald`. |
| Surface | An app that draws Claude Code: the terminal or the Desktop app. |
| Transcript | The conversation area above the prompt. |
| Toast | A short notice that Claude Code shows briefly. |
| Survey | A Claude Code survey prompt. The band is not drawn while one shows. |
| Haiku | Claude's small model (the alias `haiku`). The mod calls it through your Claude Code session, so the calls count against your plan or are billed to your API key. |
| `$.store`, `$.state` | `$.store` is the mod's persistent data, shared by every session on this machine. `$.state` is what the current session holds for drawing; `/clear`, `/resume` and `/branch` reset it, and the mod reloads it from `$.store`. |
| Stack | The packages a project's manifests declare, and the releases of them that the mod follows. |
| Manifest, lockfile | A manifest (such as `package.json`) declares dependencies with version ranges. A lockfile (such as `package-lock.json`) pins the exact versions installed. |
| Release level | How far a release is from your version: `patch`, `minor`, `major` or `unknown`. |
| Show level, toast level | Settings that choose which releases appear: the show level for the band and the pane, the toast level for toasts. See [Show and toast levels](#show-and-toast-levels). |
| Advisory id | A security advisory number, such as `CVE-2024-3651` or `GHSA-jfh8-c2jp-5v3q`. |
| Unresolved | A package whose GitHub repository the mod could not find, so nothing shows for it. |

## Install

To try the mod for one session, clone the repository and start Claude Code with the plugin directory:

```bash
git clone https://github.com/dieg666/claude-herald.git
claude --plugin-dir ./claude-herald
```

To install it from the marketplace in this repository, run this in a Claude Code session, or the two commands below in your shell:

```text
/plugin install herald --marketplace dieg666/claude-herald
```

```bash
claude plugin marketplace add dieg666/claude-herald
claude plugin install herald@claude-herald
```

If you install from your shell while a session is open, run `/reload-plugins` in that session. To check that the mod is loaded, run `/herald`, or run `claude plugin list` in your shell, which shows `herald@claude-herald` as enabled.

To update, run these in your shell and restart Claude Code (for a clone started with `--plugin-dir`, pull the repository):

```bash
claude plugin marketplace update claude-herald
claude plugin update herald@claude-herald
```

To uninstall, run `claude plugin uninstall herald@claude-herald`, or use the **Installed** tab of `/plugin`. `claude plugin marketplace remove claude-herald` removes the marketplace. Claude Code does not document whether an uninstall deletes the mod's data; [Stored data](#stored-data) says how to delete it.

## Getting started

The band appears above the prompt once the first refresh has fetched items, and releases of your dependencies join it after the mod has read their feeds. Type these first:

| Command | What it does |
|---------|--------------|
| `/herald` | Opens the pane. |
| `/herald deps` | Shows which packages the mod follows for this project and where each one's releases come from. |
| `/herald deps toast off` | Stops release toasts. By default only breaking and security releases raise one. |
| `/herald disable Hacker News` | Turns a source off. `/herald list` shows the names. |
| `/herald deps off` | Stops following this project's dependencies and leaves the other sources alone. |

## Use the band

The band appears above the prompt once at least one enabled source has items. It lists every enabled source's items and the releases of [your stack](#your-stack) in one list, newest first, and the items without a date last. The header shows the page buttons around the position (`1-3 of N`), the auto button and the selection buttons, and the selected item is marked with `›`. A news item's headline line ends with its source's name in dim text, for example `Margaret Hamilton has died` and, at the right end, `Hacker News`. On a narrow terminal a long headline keeps its room: the name is cut first, down to six cells, then dropped, and only then is the headline cut. A title that is only a version already leads with the name, so none is repeated at the right end. A release of your stack keeps its `📦` or `⚠` before the headline and shows no name. In the terminal each button shows its hotkey before its label, for example `p: ◀`. The auto button reads `⏸ auto` while the rotation runs and `▶ auto` while it is paused.

Hotkeys work while the band or the pane has keyboard focus; otherwise the keys go to the prompt. Tab moves between controls, Enter presses the focused one and Esc returns focus to the prompt. Claude Code's documentation says how a pane gets focus (opening it with `/herald` while the prompt is empty, Ctrl+X then Tab, or a click) and does not say how the band gets it, so open the pane with `/herald` to use every band action.

| Key | Button | What it does |
|-----|--------|--------------|
| `p` | ◀ | Shows the previous page of three items, wrapping at the start, and pauses the rotation. |
| `n` | ▶ | Shows the next page, wrapping at the end, and pauses the rotation. |
| `a` | ⏸ auto / ▶ auto | Pauses or resumes the rotation. |
| `k` | ↑ | Selects the item above in the page and pauses the rotation. |
| `j` | ↓ | Selects the item below in the page and pauses the rotation. |

The rotation does nothing when all items fit on one page. The band yields its place while Claude Code shows a survey.

## Use the pane

`/herald` opens the pane and asks for keyboard focus, which Claude Code grants while the prompt is empty. Esc closes the pane. The pane shows a window of the active tab's items around the selection, one line each with its headline link and, at the right end, its date. Only the selected item shows its summary, on up to three lines under its headline (none for an item without text). A source's own tab shows no source mark, since every row is from it; the Saved tab shows each item's source name in dim text just before the date column, the names ending in one column; a long headline drops the name before it is cut. The Your stack tab shows one row per package instead, grouped by ecosystem, with a summary line and a filter field above them.

| Key | Button | What it does |
|-----|--------|--------------|
| `1` to `9` | The first nine source tabs | Shows that source's items. Tabs follow the order of `/herald list`, enabled sources only. |
| `y` | Your stack | Shows the releases of your dependencies. The tab exists while the project's stack is on. |
| `0` | Saved | Shows your saved items. |
| `k` | ↑ | Selects the previous item. Stops at the first. |
| `j` | ↓ | Selects the next item. Stops at the last. |
| `r` | Mark as read | On the Saved tab only: removes the selected item from the saved list. |
| `e` | Releases / Hide releases | On the Your stack tab only: lists the selected package's releases under it, or hides them again. |

## Act on an item

The same four actions apply to the selected item in the band and in the pane, a release of your stack included. On the Your stack tab, a package's row acts on its highest release shown, and a release listed under an expanded package acts on that release.

| Key | Button | What it does |
|-----|--------|--------------|
| `o` | Open | Opens the item's address in your default browser. The headline is also a link. Addresses that are not http or https are refused. |
| `s` | Summarize | Writes a 3 to 5 line summary under the item's title in the transcript, without starting a turn. Claude does not read these lines. For a release, the summary comes from its notes. An item without text gets a line that says so instead, with no model call. |
| `v` | Save / Saved | Adds the item to the Saved tab. The button reads Saved for an item already saved, and pressing it changes nothing. |
| `c` | Copy for Claude | Copies the [copy template](#copy-template) filled with the item to the clipboard and shows a "📋 Copied" toast. It never submits a prompt. The text comes from the feed, so pasting it into the prompt makes it part of your prompt. |

## Commands

Every command replies with text as well as updating the drawing. A missing or invalid argument replies with the usage and changes nothing.

| Command | Argument | What it does |
|---------|----------|--------------|
| `/herald` | none | Opens the pane. Where no surface draws panes, lists the latest three items of each enabled source. |
| `/herald add <url> [name]` | A feed address and an optional name | Follows an RSS or Atom feed after checking that it fetches and has entries. The name defaults to the feed's title. |
| `/herald add-page <url> [name]` | A page address and an optional name | Follows a web page that fetches as HTML. Haiku reads its headlines when the page changes. |
| `/herald remove <name\|url>` | A source's name (any case), id or address | Stops following the source and forgets its items, seen ids and page hash. Saved items stay. |
| `/herald list` | none | Lists every source: on or off, kind, item count, name, address and its last error. |
| `/herald enable <name>` | A source's name | Turns a source on and refreshes it. |
| `/herald disable <name>` | A source's name | Turns a source off. It is kept but no longer fetched or shown. |
| `/herald interval <minutes>` | 1 to 1440, default 5 | Sets the minutes between refreshes and refreshes now. |
| `/herald rotate <seconds>` | 5 to 3600, default 20 | Sets the seconds between band pages. |
| `/herald lang <feed\|user\|code>` | `feed`, `user` or a language code such as `es` or `pt-BR`, default `feed` | Sets the [summary language](#summaries-and-languages). |
| `/herald template <text>` | Text with `{title}`, `{url}` or `{source}` | Sets the [copy template](#copy-template). |
| `/herald deps [subcommand]` | A subcommand and its argument, or none | Shows and tunes [your stack](#your-stack) for the project you are in. Every subcommand is in [Commands for your stack](#commands-for-your-stack). |
| `/herald reset` | none | Restores the factory sources and the default settings, the release template included. It keeps your saved items and your stack. |
| `/herald help` | none | Lists the commands. The `deps` line points to `/herald deps help`. |

The mod refuses an address that another source already follows and a name that another source already has, and it says which. Quotes around a name are optional: `/herald disable Claude status` and `/herald disable "Claude status"` do the same. Quotes matter only when a name starts with a quote character: wrap it in the other kind of quote. A name is at most 60 characters.

A feed added without a name takes the title the feed gives itself, or its host when it has none. A GitHub releases feed is titled `Release notes from REPO`, and a second source with the same name becomes `Release notes from claude-code (2)`. Pass a name to keep the list readable:

```text
/herald add https://github.com/vercel/next.js/releases.atom Next.js
```

## Sources

The mod starts with these ten sources. Disable one with `/herald disable <name>`, remove it with `/herald remove <name>`, and bring them all back with `/herald reset`.

| Name | Kind | Address | Default |
|------|------|---------|---------|
| Anthropic news | page | `https://www.anthropic.com/news` | on |
| Claude Code releases | feed | `https://github.com/anthropics/claude-code/releases.atom` | on |
| Claude Agent SDK (TS) | feed | `https://github.com/anthropics/claude-agent-sdk-typescript/releases.atom` | on |
| Anthropic Python SDK | feed | `https://github.com/anthropics/anthropic-sdk-python/releases.atom` | on |
| MCP spec | feed | `https://github.com/modelcontextprotocol/modelcontextprotocol/releases.atom` | on |
| Claude status | feed | `https://status.claude.com/history.rss` | off |
| Hacker News | feed | `https://hnrss.org/frontpage`, with `https://news.ycombinator.com/rss` as fallback when the first fails | on |
| Simon Willison | feed | `https://simonwillison.net/atom/everything/` | on |
| AINews (smol.ai) | feed | `https://news.smol.ai/rss.xml` | on |
| GitHub changelog | feed | `https://github.blog/changelog/feed/` | on |

GitHub release feeds title an entry with the bare tag. Where the source is not implied (the band, the Saved tab and the new-item toast), a title that is only a version (`v0.3.293`, `1.12.0-rc.1`, `2026-07-28`, `Release 7.3.1`) is drawn with the source's name before it, for example `Claude Code v2.1.293`. A source's own tab keeps the bare tag, and the stored title does not change. A title that names a package (`@scope/pkg@1.2.3`) or says more than a version is left as it is.

To follow a GitHub repository's releases as a news source, add its feed: `/herald add https://github.com/OWNER/REPO/releases.atom`. To follow it as part of [your stack](#your-stack), with a version comparison and flags, run `/herald deps add OWNER/REPO`.

Each source keeps its 30 newest items. An item is identified by its source and its guid, id or link, so a repeated item appears once. A source whose fetch fails keeps its last items and retries at the next refresh; the reason shows in `/herald list`. A page source has no feed to parse: the mod turns the page into text and asks Haiku for a JSON list of `title`, `url`, `date` and `teaser`, only when the page text or the extraction prompt has changed, and drops malformed entries. The teaser is the one-line description the page shows under a headline, copied as written, at most 200 characters; it is the item's text, and an item from a page that shows none has no text.

A refresh runs when the session starts and then every 5 minutes, fetching three sources at a time, and then refreshes your stack within its [limits](#limits-per-refresh). When it finds new items, one toast names them, for example `3 new: Title …`. A source's first load shows no toast.

## Copy template

Copy for Claude puts the copy template on the clipboard, or the release template for a release of your stack. The defaults are:

```text
Read this and tell me whether it affects this project: {title} {url}
```

```text
We use {pkg} {current}. {pkg} {new} is out: {url}
Check whether it affects this project and what we'd need to change.
```

| Placeholder | Replaced with |
|-------------|---------------|
| `{title}`, `{url}`, `{source}` | Copy template: the item's headline, its address, and its source's name. |
| `{pkg}`, `{current}`, `{new}`, `{url}` | Release template: the package's name, the version you use (`unknown` when the mod has none), the release's version (its title when it names none), and the release's address. |

A template must contain `{title}` or `{url}` (the release template: `{pkg}` or `{url}`), may use no other placeholder of its kind, and is at most 1000 characters. The mod collapses each filled value to one line, because feed text is untrusted, and removes a pair of quotes that encloses the whole template. `/herald template <text>` sets the copy template, and `/herald deps template <text>` sets the release template for every project.

## Summaries and languages

The band shows a one-line summary under each headline, the pane under the selected headline only (wrapped onto up to three lines), and both show `…` while it is pending. The mod writes summaries from the item's title and the excerpt the feed carries (at most 500 characters), not from the linked page. Link and counter lines (such as Hacker News' `Article URL`, `Points` and `# Comments`) are left out of the excerpt. An item with no text left, such as a Hacker News link post or a page item without a teaser, gets no summary and no model call: the pane draws its headline alone, and the band leaves its second line empty so the band keeps its height as it turns. Summarize on such an item says there is no text to summarize. A reply that talks about the item or its title instead of the story (such as "according to the title"), or that shows the model's reasoning, is dropped and not kept, and the item is asked about again the next time it is shown. After two such replies for the same item, language and length, the mod stops asking for an hour and shows no summary line for the item meanwhile.

`/herald lang` sets the language of every summary:

| Value | Summaries are written in |
|-------|--------------------------|
| `feed` (default) | The language of the item itself. |
| `user` | The language of Claude Code's `language` setting. Without that setting, the item's own language. |
| A code such as `es` or `pt-BR` | That language, whatever the item's language. |

The mod keeps one summary per item, language and length. Changing the language summarizes the shown items again in the new one, and a summary already kept in that language is reused. A summary written by an older version of the mod's prompts is not reused; it leaves the cache as newer summaries push it out.

## Your stack

The mod follows the releases of the packages your project depends on. It reads the project's manifests and lockfiles, finds each package's GitHub repository through its registry, reads the repository's release feed on the refresh timer, and shows releases newer than your version in the band and the pane. Settings, followed packages and releases are kept per project.

The project is the closest directory at or above the session's directory that holds `.git`, never your home directory or one above it. Without a `.git` it is the session's directory alone. At a filesystem root there is no project, and `/herald deps` says so.

### What the mod follows

The mod detects the stack a moment after the session starts, on `/herald deps rescan`, after a command that changes what is followed, and on the refresh timer when a manifest or lockfile it read has changed. The timer re-reads only the files it read before, so a manifest added somewhere new waits for the next session or a rescan. The ecosystems are npm, Python, Go, Rust, Ruby, PHP, .NET, Java, Swift and Dart. The file names, the skipped directories and the walk limits are in [Files stack detection reads](docs/security.md#files-stack-detection-reads).

- **One entry per package.** A package that several manifests declare is followed once per ecosystem and name, from its runtime, root-declared declaration first.
- **Version in use.** The version a lockfile pins, else the manifest's exact version, else the lowest version the declared range allows. Releases at or below it are hidden.
- **Dev dependencies.** Left out until you run `/herald deps dev on`. A dev dependency is one the manifest marks as not installed by default. In npm that is `devDependencies`. In Python it is `[project.optional-dependencies]`, `[dependency-groups]`, uv `dev-dependencies`, every Poetry group, Poetry `dev-dependencies` and optional Poetry dependencies, and requirements files named for development (`requirements-dev.txt`: the name holds dev, develop, test, tests, testing, lint, doc, docs, ci, typing, types, check or bench).
- **Cap.** At most 50 packages (`/herald deps cap`, 1 to 500). Over the cap, runtime dependencies come before dev ones, and root-declared before the rest.
- **Added and ignored.** A package you add with `/herald deps add` is followed first, counts toward the cap and is not read from any file. A package you ignore is never followed.

### How a package finds its releases

1. A GitHub address in the manifest (a git dependency, a Swift package URL) names the repository.
2. Otherwise the package's registry does ([Network hosts](docs/security.md#network-hosts)). A Go module under `github.com/` or `golang.org/x/` needs no request. Swift and Dart (pub) have no registry lookup.
3. The mod reads `https://github.com/OWNER/REPO/releases.atom`, or `tags.atom` when the repository publishes no releases.

A package is unresolved when its repository is not on GitHub, its registry does not know it, its name is not valid for that registry or it has no lookup. `/herald deps` lists it with the reason, and nothing shows for it. A mapping, an unresolved one included, is kept for 7 days. A failed request is not kept: `/herald deps` shows that package as `not looked up yet` (or with its older mapping), the failure goes to the debug log only, and the mod waits an hour before it tries again.

`/herald deps map` sets where a package's releases are read, in every project, and the mapping never expires. To replace it, run `map` again; `/herald deps map <package> off` removes it, so the package is looked up in its registry again. `/herald reset` does not clear it. `/herald deps add owner/repo` follows a repository as the `github` ecosystem: no registry lookup, every tag counts as a release, and with no version in use every level is `unknown`. For any other package, a release whose tag names another package of the repository (`other@1.2.0`) is skipped.

### How a release is classified

The mod takes a release's version from its GitHub tag, else its title, and compares it with yours. The release level is `patch`, `minor` or `major`, from the first part of the version that differs. Below 1.0 the first non-zero part is the boundary, as in caret ranges, so `0.3.1` to `0.4.0` is `major` without being flagged breaking. The level is `unknown` when either version cannot be compared, for example when nothing pins a version and the range has no lower bound. A pre-release such as `2.0.0-rc.1` keeps its level and is marked `pre-release`.

Each release also gets a `breaking` and a `security` flag. Keywords set them first: "breaking" as a whole word, not right after "no", "non", "not" or "without"; an advisory id; the words "security" and "vulnerability". Then Haiku reads the notes and answers breaking and security, and its answer replaces the keyword flags, except that an advisory id in the title or notes always sets `security`. When Haiku gives no usable answer, the keyword flags stand.

### Show and toast levels

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

### What you see

- **Band and Saved rows.** `📦 pkg current → new`, then ` · title` when the title says more than the version; `⚠` replaces `📦` on a flagged release. A second line shows the ecosystem, the level when known, `pre-release` and the flags, for example `npm · major · breaking`. A row has a flag check and no Haiku summary.
- **Your stack tab.** Press `y` in the pane. Packages are grouped by ecosystem, one row each, in aligned columns: `⚠  jsdom  25.0.1 → 30.1.2  major  breaking in 30.0.0 · 3 releases  Oct 5`. The row shows the version in use, the highest release shown (the highest stable version, a pre-release only when no stable one is shown, so a later backport such as `7.0.3` after `8.0.0` does not replace it), the highest level among the releases shown, each flag with the release that brought it (just `security` when that is the highest), `pre-release` when the highest is one, how many releases are shown when more than one, and the highest one's date. Only the part of the new version that changed is colored, by that release's own level: red for major (a `0.x` minor is major), yellow for minor, green for patch, none for `unknown`. `⚠` marks a package with any flagged release shown, `📦` the others. Inside each ecosystem, packages with a flagged release come first, then major, minor, patch and `unknown`, then by the date shown, newest first. A line under the heading counts the packages at the show level, before the filter: `6 packages behind · 2 security · 1 breaking`, leaving out counts of zero. Press `e` to list the selected package's releases under it, indented, one line each with its level, flags and date, and `e` again to hide them; the expanded packages last for the session, like the filter. Every release of the packages in view gets the flag check. The filter field takes words, up to 100 characters, that must all appear in the package name, ecosystem, level (the package's highest) or a flag of any of its releases shown. Where the surface has no text field (mobile), the filter in force shows as a dim `Filter: …` line, and `/herald deps filter <text>` sets it. The filter lives in session state only: a new session, `/clear`, `/resume`, `/branch` and a change of project start without it.
- **Toast.** One toast per refresh names the new releases at the toast level, flagged ones first: `2 releases: lodash 4.17.20 → 5.0.0 ⚠, zod 3.22.0 → 3.23.0`. With three or more it names the first: `3 releases: lodash 4.17.20 → 5.0.0 ⚠ …`.
- **Nothing drawn.** `/herald deps` lists the followed packages and where their releases come from, not the releases.

### Limits per refresh

The stack refreshes after every source refresh, on the same timer.

| Bound | Value |
|-------|-------|
| Registry lookups | 10 per run, 2 at a time. The rest wait for the next run. |
| Release feeds read | 10 per run, the least recently read first, 2 at a time. A feed is read again after 1 hour, or when your version changed. |
| Release checks by Haiku | 12 per run, 2 model calls at a time. |
| Request deadline | 30 seconds per registry or feed request. A request that takes longer counts as a failure. |
| Retries | 3 after a 429 or 5xx answer, after 1, 2 and 4 seconds. The mod does not read `Retry-After`. |
| Pause after a failure | 1 hour for a package's lookup, a feed, or a release's check. A new session starts without it. |
| Releases kept | 5 per package and 100 per project, newest first. |

### Commands for your stack

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

## Cost

The mod calls Haiku through your Claude Code session, so the calls count against your plan or are billed to your API key. Each call is small: one-line summaries are capped at 120 output tokens, long summaries at 400, page extraction at 6000 and a release check at 60, with timeouts of 20, 45, 60 and 20 seconds. At most two model calls are in flight at once, and a refresh extracts from at most three page sources at a time.

| Call | When it happens |
|------|-----------------|
| One-line summary | For each new item with text a refresh finds, newest first, at most 12 per run; for each item with text on a band page and in the pane's window, the selected item first. The first `/herald` of a session, before the pane has been drawn, summarizes up to 20 items. |
| Long summary | When you press Summarize on an item with text. |
| Page extraction | When a page source's text, or the extraction prompt, has a different hash from the last extraction. |
| Release check | One call per release, to flag it from its notes. For releases a refresh has not seen before, never on a package's first read: at most 12 per run, notes cut to 4000 characters. For release rows the band or the pane shows that have no verdict yet: at most 12 per view, notes cut to 1000 characters. |

The mod caches every summary (by item, language, length and prompt version) and every release verdict (by release id), so it asks for each once while it stays cached. A failed call, or a reply that talks about the item instead of the story, is retried the next time the item is shown, except that after two such replies for an item the mod waits an hour before asking again; after the model gives no answer for a release, a view waits an hour before asking again. A release gets no check when the keywords already flag both breaking and security with an advisory id, or after two malformed answers. Release checks follow the number of new releases of the packages you follow, not the time: a quiet day costs none, and a refresh run makes at most 12.

To cut the cost, pause the rotation with `a` (each band page it reaches gets summaries and checks) or run `/herald rotate 3600`; run `/herald deps off` to stop all stack requests and calls; lower `/herald deps cap`, `ignore` packages or raise `/herald deps level` to check fewer releases. `/herald deps toast off` cuts nothing, because the check on new releases runs whatever the toast level.

## Privacy and permissions

The mod sends three kinds of data off your machine. Package names (and for NuGet and Maven the version in use) go to the package registries and `github.com`, only while a project's stack is on. Feed and page requests go to the host of each enabled source, and to the address you give to `/herald add` or `/herald add-page`. Item titles and excerpts, page text and release notes go to Haiku through your Claude Code session. The registries and hosts are listed in [Network hosts](docs/security.md#network-hosts).

### What the mod never reads

The mod does not read your prompts, the conversation or your tool calls. The `hooks:` line of `claude plugin validate .` lists every event it listens to:

```text
./register.tsx hooks: session.start, command.run{command=herald}, ui.render{component=AbovePrompt}, ui.render{component=Pane, requestId=herald}, classic.SessionStart{source=clear|resume|fork}
```

It hooks no `prompt.submit`, no `tool.call` and no transcript event. The only files it reads are the manifests and lockfiles in [Files stack detection reads](docs/security.md#files-stack-detection-reads). To check it yourself, run `claude plugin validate <plugin folder>` and read the `hooks:` and `calls:` lines.

[docs/security.md](docs/security.md) has the hooks table, the host table, the commands the mod runs, how it treats untrusted text and the risks it accepts.

### Calls

`claude plugin validate .` lists these calls, and each has a reason here.

| Call | Why the mod needs it |
|------|----------------------|
| `$.clock.after` | Deadlines for fetches and refresh runs, waits between retries, scheduling stack detection. |
| `$.clock.every` | The refresh timer and the band rotation timer. |
| `$.clock.now` | Timestamps for saved items, refresh runs, feed mappings, feed reads and failures. |
| `$.command.register` | Declares the `/herald` command. |
| `$.env.get` | Reads `HOME` and `USERPROFILE` (so a `.git` at or above your home directory is not a project) and `OS` (to pick the opener and clipboard tool on Windows). |
| `$.fs.list` | Lists the project's directories to find its root and manifests. |
| `$.fs.read` | Reads the project's manifests and lockfiles, up to 4 MiB each. |
| `$.http.fetch` | Fetches feeds and pages, checks the address of `/herald add` and `/herald add-page`, looks packages up in their registries, reads release feeds. |
| `$.model.complete` | Asks Haiku for summaries, page headlines and release flags. |
| `$.process.run` | Runs `uname -s`, the browser opener and, if `$.ui.copy` fails, a clipboard tool. |
| `$.session.root` | The directory stack detection starts from. |
| `$.session.surfaces` | Whether the session draws panes, to choose between the pane and the text reply. |
| `$.settings.read` | Claude Code's `language` setting, for `/herald lang user`. |
| `$.state.get` | The values the band and the pane draw. |
| `$.state.set` | Writes those values: items, saved list, summaries, band page, pane tab, refresh status, and the stack's releases, settings and filter. |
| `$.store.get` | Reads the [stored data](#stored-data). |
| `$.store.set` | Writes the stored data. |
| `$.ui.copy` | Puts the filled template on the clipboard of the surface you pressed on. |
| `$.ui.log` | Debug lines, and the lines of a long summary in the transcript. |
| `$.ui.open` | Opens the `/herald` pane. |
| `$.ui.resolve` | The `Box`, `Text`, `Button` and `Link` elements the band and the pane draw with, and the `Input` of the stack tab's filter where the surface has one. |
| `$.ui.toast` | The new-item, new-release and "Copied" toasts, and action errors. |

## Stored data

The mod keeps its data in `$.store`, which every Claude Code session on the machine shares, and reloads what the drawings need after `/clear`, `/resume` and `/branch`.

| Key | Holds |
|-----|-------|
| `sources` | Every source, factory or added, with its on or off state. |
| `settings` | Refresh interval, rotation seconds, summary language, copy template and release template. |
| `saved` | Your saved items. |
| `seen` | The newest 300 item ids per source. |
| `items` | The last items of each source, at most 30. |
| `pageHashes` | The hash of each page source's text, with the extraction prompt, at its last extraction. |
| `summaries` | The summary cache, at most 300 entries, the oldest dropped first, each with the version of the prompts that wrote it. An item pushed out, or summarized by an older version, is summarized again when it is shown. |
| `deps` | Per project root, at most 20 projects (the least recently detected is dropped): stack settings, followed packages, packages you ignored and added (at most 500 each), a hash of each manifest and lockfile read, and the detection time. |
| `depFeeds` | The release feed of each package, by `<ecosystem>:<name>`, with negative results and your `deps map` mappings. A looked-up mapping is trusted for 7 days, and at most 500 are kept; a mapping you set never expires or counts toward the 500. |
| `releaseFlags` | Haiku's verdict for each release, by release id. At most 500, the oldest dropped first. |
| `stack` | Per project root, at most 5 projects (the least recently refreshed is dropped): each followed package's newest 5 releases (at most 100 per project, notes cut to 1000 characters), its last 10 release ids seen, and when its feed was last read. |

`/herald reset` restores the factory sources, with their factory on or off state, and the default settings, and removes the sources you added with their items, seen ids and page hashes. It keeps your saved items and leaves `deps`, `depFeeds`, `releaseFlags` and `stack` as they are, your `deps map` mappings included.

On Claude Code 2.1.293 the store file was observed at `~/.claude/plugins/store/herald_<source>-<id>.json` (`herald_inline-…json` for a `--plugin-dir` load). Claude Code's documentation does not name this file, so the path is observed, not documented. To delete everything the mod stored, quit Claude Code and delete that file. The store is kept per plugin name, so a store from before the mod was renamed from news to Herald is not read and is not migrated.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| The band does not appear. | It is drawn once an enabled source has items, so wait for the first refresh. `/herald list` shows each source's item count and last error. It is also hidden while a Claude Code survey shows. |
| `/herald` does nothing visible. | Run `/plugin` and look for `herald` on the `mods active` line. If it is missing, run `/reload-plugins`. |
| A source shows an error in `/herald list`. | It failed its last fetch, and the mod keeps its older items. See [Limitations](#limitations) for headers and fetch policy. |
| A release does not show. | It is at or below your version; it is a patch release and the show level is `minor+`; it is a pre-release and the show level is not `all`; its package waits for a lookup (10 per refresh), is paused for an hour after a failure, or is `unresolved` in `/herald deps`; or the stack is off for this project. |
| A package is `unresolved`. | Its registry names no GitHub repository, GitHub does not have it, or its name is not valid for that registry. Run `/herald deps map <package> <owner/repo\|feed-url>`. |
| A hotkey types the letter into the prompt. | The band or the pane does not have keyboard focus. Open the pane with `/herald`. |
| A summary shows `…` for a long time. | It waits for a model call. A failed call is retried the next time the item is shown. |

## Limitations

- **The Linux opener's exit code is not checked.** The mod starts `xdg-open` detached through `sh`, so a missing `xdg-open` shows no error. The headline link still works.
- **`$.process.run` is available in the CLI only.** On the Desktop app, Open and the clipboard fallback can fail with a toast. Copy uses `$.ui.copy` first, and the headline link opens the item.
- **The `clip.exe` fallback can garble non-ASCII text.** It reads the OEM code page. The mod tries PowerShell first on Windows and WSL.
- **Source fetches add no headers of their own.** Claude Code may add its own, and its documentation does not say which. Registry and release feed requests send the `User-Agent` in [docs/security.md](docs/security.md#what-leaves-your-machine). A feed that needs a specific User-Agent shows as a failed source in `/herald list`.
- **`$.http.fetch` cannot be aborted.** A request that hangs counts as failed for its source after 90 seconds, and a stack registry or feed request after 30 seconds, but it keeps running until it ends. Turning a refresh off or restarting it waits for the request in progress to fail.
- **The mod has no host allowlist and does not block private addresses.** `/herald add`, `/herald add-page` and `/herald deps map <package> <feed-url>` fetch any http or https address you give, including `localhost` and addresses on your network. Redirects are followed, so a redirect can lead to any host, those included.
- **A web-fetch policy of your organization can refuse the fetches.** The sources then show as failed.
- **Every session refreshes on its own.** Two open sessions fetch each source twice per interval, look up and read your stack twice, and share one store. The one hour pause after a failure is not shared.
- **Hotkeys need keyboard focus** on the band or the pane.

## Design notes

| Behaviour | Why |
|-----------|-----|
| The plugin is named `herald` and the marketplace `claude-herald`. | `claude plugin validate` refuses plugin names that start with `claude-`; a marketplace name may. |
| `p` and `n` page the band. | Claude Code accepts only a lowercase letter or a digit as a hotkey, and a band digit also fires from an empty prompt. |
| Copy uses `$.ui.copy` first, then `pbcopy`, `wl-copy`, `xclip` or `clip.exe` by system (PowerShell on Windows and WSL), when `$.ui.copy` copies nothing for a reason other than a refusal. | `$.ui.copy` writes to the clipboard of the surface you pressed on and needs no external tool. |
| Source tabs take `1` to `9` by position, Your stack is `y`, Saved is `0`. | Saved keeps one key however many sources you follow. |
| The Your stack tab lists releases under a package on `e`, not `r`. | `r` is Mark as read on the Saved tab, and the pane keeps every hotkey distinct. |
| The pane draws only the items that fit, centred on the selection. | The mod does not need to call `$.ui.scroll`. |
| The band header draws `◀` `▶` `⏸` as they are, and release rows draw `📦` and `⚠` in a glyph column two cells wide (news rows have none). | Some terminals draw `◀` `▶` `⏸` as two-cell emoji, which can misalign the header; `📦` is two cells, so the column pads a one-cell glyph. |
| A long summary has 3 to 5 lines, or 1 or 2 when the model's reply has fewer than three sentences. | The mod does not pad a short reply. |
| The pane shows dates as `Oct 8`, in UTC. | The date does not depend on the machine's time zone. |
| The first `/herald` of a session summarizes up to 20 items before the pane is drawn. | The mod learns how many rows fit only when the pane is drawn. |
| A release row gets a flag check, not a summary. | Its level and flags come from the classification, and Summarize still writes a summary of the notes. |
| The release template is one setting for all projects; levels, cap and dev toggle are per project. | The template sits beside the copy template, and `/herald reset` restores both. |

## Development

You need Claude Code 2.1.287 or later and [Bun](https://bun.sh). To run every check, run:

```bash
scripts/check.sh
```

The script runs these steps and stops at the first failure:

1. `claude plugin validate .`, which must pass. It reports one warning, because `CLAUDE.md` at the plugin root holds the working rules for contributors and is not loaded as context.
2. `bunx prettier@3 --check` on `hooks`, `tests` and `types`.
3. `bunx -p typescript@5 tsc -p .`.
4. `claude plugin test .`, which runs the tests with a mocked clock, store, network and model.

The Claude Code types for your build live in `.claude-plugin/types` and are not committed. Claude Code writes them each time it loads the mod, and the script triggers that on its first run with `claude -p "/cost" --plugin-dir .`, a local command that makes no model call.

Installed copies update only when `version` in `.claude-plugin/plugin.json` changes, because the manifest pins it. A new `calls:` entry in the output of `claude plugin validate .` needs a matching row in the [calls table](#calls). `CLAUDE.md` describes the layout of `hooks/`, the rules the engine's static analysis enforces and the test conventions.
