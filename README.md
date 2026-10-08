# News

A Claude Code mod that keeps you up to date on Claude and the tools around it without leaving the terminal. It follows RSS/Atom feeds and web pages, shows the latest items in a rotating band above the prompt, and opens a `/news` pane with a tab per source.

- **Band**: three items at a time above the prompt, each with a source glyph, a headline link and a one-line Haiku summary. The band turns its page every 20 seconds until you navigate it yourself.
- **Pane**: `/news` opens a pane with one tab per enabled source and a Saved tab.
- **Actions** on the selected item, in the band and the pane: open it in the browser, show a 3 to 5 line summary, save it for later, and copy it for Claude.
- **Commands**: `/news` adds, removes and tunes sources. Every command also answers with text, so it works where nothing is drawn.
- **Sources**: factory sources (Anthropic news, release feeds of Claude Code and the SDKs, Hacker News and more). You can disable or remove any of them and add your own.

## Requirements

- Claude Code 2.1.287 or later. Tested with Claude Code 2.1.293.
- A terminal or the Desktop app to draw the band and the pane. In other places, such as `claude -p`, VS Code and cloud sessions, `/news` answers with the latest items as text.
- A session that can call a model. Summaries use Haiku through your plan or API key (see [Cost](#cost)).

## Terms

| Term | Meaning |
|------|---------|
| Mod | A plugin that changes how Claude Code looks and behaves. This repository is one plugin, named `news`. |
| Surface | An app that draws Claude Code: the terminal or the Desktop app. |
| Transcript | The conversation area above the prompt. |
| Toast | A short notice that Claude Code shows briefly. |
| Survey | A Claude Code survey prompt. The band is not drawn while one shows. |
| `$.store` | The mod's persistent data: a JSON file of its own under your Claude Code configuration directory, shared by every session on this machine. |
| `$.state` | What the mod holds for drawing in the current session. `/clear`, `/resume` and `/branch` reset it, and the mod reloads it from `$.store`. |

## Install

To try the mod for one session, clone the repository and start Claude Code with the plugin directory:

```bash
git clone https://github.com/dieg666/claude-code-news-mod.git
claude --plugin-dir ./claude-code-news-mod
```

To install it from the marketplace in this repository, run this in a Claude Code session:

```text
/plugin install news --marketplace dieg666/claude-code-news-mod
```

Or run these in your shell:

```bash
claude plugin marketplace add dieg666/claude-code-news-mod
claude plugin install news@news-mod
```

If you install from your shell while a session is open, run `/reload-plugins` in that session. To check that the mod is loaded, run `/news`. The pane opens, or the command prints the latest items when no pane is drawn. In your shell, `claude plugin list` shows `news@news-mod` as enabled, and `/plugin` in a session names the mod on its `mods active` line.

To update an installed mod, run these in your shell and restart Claude Code to apply the update:

```bash
claude plugin marketplace update news-mod
claude plugin update news@news-mod
```

To update a clone you started with `--plugin-dir`, pull the repository.

To uninstall the mod, run this in your shell, or disable or uninstall it from the **Installed** tab of `/plugin`:

```bash
claude plugin uninstall news@news-mod
```

To remove the marketplace as well, run `claude plugin marketplace remove news-mod`.

## Use the band

The band appears above the prompt once at least one enabled source has items. It lists every enabled source's items in one list, newest first, and the items without a date last. The header shows the page buttons around the position (`1-3 of N`), the auto button and the selection buttons, and the selected item is marked with `›`. In the terminal each button shows its hotkey before its label, for example `p: ◀`. While the rotation is paused the auto button reads `▶ auto`, and while it runs, `⏸ auto`.

Hotkeys work while the band or the pane has keyboard focus; otherwise the keys go to the prompt. Tab moves between controls, Enter presses the focused one and Esc returns focus to the prompt. Claude Code's documentation says how a pane gets focus (opening it with `/news` while the prompt is empty, Ctrl+X then Tab, or a click) and does not say how the band gets it. To use the keys without that, open the pane with `/news`, which has every band action.

| Key | Button | What it does |
|-----|--------|--------------|
| `p` | ◀ | Shows the previous page of three items, wrapping at the start, and pauses the rotation. |
| `n` | ▶ | Shows the next page, wrapping at the end, and pauses the rotation. |
| `a` | ⏸ auto / ▶ auto | Pauses or resumes the rotation. |
| `k` | ↑ | Selects the item above in the page and pauses the rotation. |
| `j` | ↓ | Selects the item below in the page and pauses the rotation. |

The rotation does nothing when all items fit on one page. The band yields its place while Claude Code shows a survey.

## Use the pane

`/news` opens the pane and asks for keyboard focus, which Claude Code grants while the prompt is empty. Esc closes the pane. The pane shows a window of the active tab's items around the selection, each with its source glyph, headline link, date and summary.

| Key | Button | What it does |
|-----|--------|--------------|
| `1` to `9` | The first nine source tabs | Shows that source's items. Tabs follow the order of `/news list`, enabled sources only. |
| `0` | Saved | Shows your saved items. |
| `k` | ↑ | Selects the previous item. Stops at the first. |
| `j` | ↓ | Selects the next item. Stops at the last. |
| `r` | Mark as read | On the Saved tab only: removes the selected item from the saved list. |

## Act on an item

The same four actions apply to the selected item in the band and in the pane.

| Key | Button | What it does |
|-----|--------|--------------|
| `o` | Open | Opens the item's address in your default browser. The headline is also a link. Addresses that are not http or https are refused. |
| `s` | Summarize | Writes a 3 to 5 line summary under the item's title in the transcript, without starting a turn. Claude does not read these lines. |
| `v` | Save / Saved | Adds the item to the Saved tab. The button reads Saved for an item already saved, and pressing it changes nothing. |
| `c` | Copy for Claude | Copies the [copy template](#copy-template) filled with the item to the clipboard and shows a "📋 Copied" toast. It never submits a prompt. The text comes from the feed, so pasting it into the prompt makes it part of your prompt. |

## Commands

Every command replies with text as well as updating the drawing. A missing or invalid argument replies with the usage and changes nothing.

| Command | Argument | What it does |
|---------|----------|--------------|
| `/news` | none | Opens the pane. Where no surface draws panes, lists the latest three items of each enabled source. |
| `/news add <url> [name]` | A feed address and an optional name | Follows an RSS or Atom feed after checking that it fetches and has entries. The name defaults to the feed's title. |
| `/news add-page <url> [name]` | A page address and an optional name | Follows a web page that fetches as HTML. Haiku reads its headlines when the page changes. |
| `/news remove <name\|url>` | A source's name (any case), id or address | Stops following the source and forgets its items, seen ids and page hash. Saved items stay. |
| `/news list` | none | Lists every source: on or off, kind, item count, name, address and its last error. |
| `/news enable <name>` | A source's name | Turns a source on and refreshes it. |
| `/news disable <name>` | A source's name | Turns a source off. It is kept but no longer fetched or shown. |
| `/news interval <minutes>` | 1 to 1440, default 5 | Sets the minutes between refreshes and refreshes now. |
| `/news rotate <seconds>` | 5 to 3600, default 20 | Sets the seconds between band pages. |
| `/news lang <feed\|user\|code>` | `feed`, `user` or a language code such as `es` or `pt-BR`, default `feed` | Sets the [summary language](#summaries-and-languages). |
| `/news template <text>` | Text with `{title}`, `{url}` or `{source}` | Sets the [copy template](#copy-template). |
| `/news reset` | none | Restores the factory sources and the default settings. See [Stored data](#stored-data). |
| `/news help` | none | Lists the commands. |

The mod refuses an address that another source already follows and a name that another source already has, and it says which.

Quotes around a name are optional, because the words after a subcommand are joined with single spaces. `/news disable Claude status` and `/news disable "Claude status"` do the same. Quotes matter only when a name starts with a quote character: wrap it in the other kind of quote. A name is at most 60 characters.

A feed added without a name takes the title the feed gives itself, or its host when it has none. A GitHub releases feed is titled `Release notes from REPO`, for example `Release notes from claude-code`, and a second source with the same name becomes `Release notes from claude-code (2)`. Pass a name to keep the list readable:

```text
/news add https://github.com/vercel/next.js/releases.atom Next.js
```

## Sources

The mod starts with these ten sources. Any of them can be disabled with `/news disable <name>` or removed with `/news remove <name>`, and `/news reset` brings them back.

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

To follow the releases of any GitHub repository, add its Atom feed, for example `/news add https://github.com/OWNER/REPO/releases.atom`.

Each source keeps its 30 newest items. The mod identifies an item by its source and its guid, id or link, so an item that a feed repeats appears once. A source whose fetch fails keeps its last items and retries at the next refresh. The reason shows in `/news list`.

A page source has no feed to parse. The mod turns the page into text and asks Haiku for a JSON list of `title`, `url` and `date`. It drops entries that are malformed, and it asks only when the page text has changed since the last time. Items from a page carry a title and no text.

A refresh runs when the session starts and then every 5 minutes. It fetches three sources at a time. When a refresh finds new items, one toast names them, for example `3 new: Title …`. A source's first load shows no toast.

## Copy template

The template is the text that Copy for Claude puts on the clipboard. The default is:

```text
Read this and tell me whether it affects this project: {title} {url}
```

| Placeholder | Replaced with |
|-------------|---------------|
| `{title}` | The item's headline. |
| `{url}` | The item's address. |
| `{source}` | The name of the item's source. |

The template must contain `{title}` or `{url}`, must not use any other placeholder, and is at most 1000 characters. The mod collapses each filled value to one line, because feed text is untrusted. A pair of quotes that encloses the whole template is removed.

## Summaries and languages

The band and the pane show a one-line summary under each headline, and `…` while it is pending. The mod writes summaries from the item's title and the excerpt the feed carries (at most 500 characters), not from the linked page.

`/news lang` sets the language of every summary:

| Value | Summaries are written in |
|-------|--------------------------|
| `feed` (default) | The language of the item itself. |
| `user` | The language of Claude Code's `language` setting. Without that setting, the item's own language. |
| A code such as `es` or `pt-BR` | That language, whatever the item's language. |

The mod keeps one summary per item, language and length. Changing the language summarizes the shown items again in the new one, and a summary already kept in that language is reused.

## Stored data

The mod keeps its data in `$.store`, which every Claude Code session on the machine shares. After `/clear`, `/resume` and `/branch`, it reloads what the drawings need from the store.

| Key | Holds |
|-----|-------|
| `sources` | Every source, factory or added, with its on or off state. |
| `settings` | Refresh interval, rotation seconds, summary language and copy template. |
| `saved` | Your saved items. |
| `seen` | The newest 300 item ids per source, used to find new items. |
| `items` | The last items of each source, at most 30. |
| `pageHashes` | The hash of each page source's text at its last extraction. |
| `summaries` | The summary cache, at most 300 entries; the oldest is dropped first. |
| `deps` | The dependencies found in each project's manifests, for at most 20 projects. See [Your stack](#your-stack-in-progress). |

`/news reset` is a factory reset. It restores the factory sources with their factory on or off state, restores the default settings, and removes the sources you added together with their items, seen ids and page hashes. It keeps your saved items.

## Cost

The mod calls Haiku through your Claude Code session, so the calls count against your plan or are billed to your API key. Each call is small: one-line summaries are capped at 120 output tokens, long summaries at 400 and page extraction at 3000, and each call has a timeout of 20, 45 and 45 seconds. At most two summary calls are in flight at once, and a refresh extracts from at most three page sources at a time.

| Call | When it happens |
|------|-----------------|
| One-line summary | For each new item found by a refresh, newest first, at most 12 per refresh run. For each item on a page that the band turns to, and for each item the pane shows. The first `/news` of a session, before the pane has been drawn, summarizes up to 20 items. |
| Long summary | When you press Summarize on an item. |
| Page extraction | When a page source's text has a different hash from the last extraction. |

The mod caches every summary by item, language and length, so it asks for each at most once while it stays in the cache. A call that fails is not cached and is retried the next time the item is shown. Auto-rotation turns the band through the items one page at a time, and each page it reaches gets its summaries. To limit the calls, pause the rotation with `a` or set a long rotation with `/news rotate 3600`.

## Permissions

`claude plugin validate .` lists what the mod can do. Every entry has a reason here. The mod never reads your prompts or your tool calls: the [hooks](#hooks) are the only events it listens to.

### Calls

| Call | Why the mod needs it |
|------|----------------------|
| `$.clock.after` | Sets the deadline of each source fetch and of each refresh run, and schedules stack detection after the session starts. |
| `$.clock.every` | Runs the refresh timer and the band rotation timer. |
| `$.clock.now` | Stamps saved items and the end of a refresh run. |
| `$.command.register` | Declares the `/news` command. |
| `$.env.get` | Reads `HOME` and `USERPROFILE` (so a `.git` at or above your home directory is not taken as a project) and `OS` (to pick the opener and the clipboard tool on Windows). |
| `$.fs.list` | Lists the project's directories to find its root and its manifests during stack detection. |
| `$.fs.read` | Reads the project's manifests and lockfiles during stack detection, up to 4 MiB each. |
| `$.http.fetch` | Fetches feeds and pages, and checks the address of `/news add` and `/news add-page`. |
| `$.model.complete` | Asks Haiku for summaries and for the headlines of a page. |
| `$.process.run` | Runs `uname -s` to detect macOS, the browser opener (`open`, `rundll32` or `xdg-open`) and, if `$.ui.copy` fails, a clipboard tool. |
| `$.session.root` | Gives the directory stack detection starts from. |
| `$.session.surfaces` | Tells whether the session draws panes, to choose between the pane and the text reply. |
| `$.settings.read` | Reads Claude Code's `language` setting for `/news lang user`. |
| `$.state.get` | Reads the values the band and the pane draw. |
| `$.state.set` | Writes those values: the items, the saved list, the summaries, the band page, the pane tab and the refresh status. |
| `$.store.get` | Reads the [stored data](#stored-data). |
| `$.store.set` | Writes the stored data. |
| `$.ui.copy` | Puts the filled copy template on the clipboard of the surface you pressed on. |
| `$.ui.log` | Writes debug lines, and writes the lines of a long summary to the transcript. |
| `$.ui.open` | Opens the `/news` pane. |
| `$.ui.resolve` | Gets the `Box`, `Text`, `Button` and `Link` elements the band and the pane draw with. |
| `$.ui.toast` | Shows the new-item toast, the "Copied" toast and action errors. |

The mod reads the environment variables `HOME`, `OS` and `USERPROFILE` and writes none. It writes only its own `news.*` state values (`band`, `items`, `pane`, `saved`, `settings`, `sources`, `status`, `summaries`).

### Hooks

| Hook | What it does |
|------|--------------|
| `session.start` | Loads the stored data, starts the refresh and rotation timers, schedules stack detection and registers `/news`. |
| `command.run` with `command=news` | Runs `/news` and answers with text. |
| `ui.render` with `component=AbovePrompt` | Draws the band and keeps what other mods draw there. |
| `ui.render` with `component=Pane` and `requestId=news` | Draws the `/news` pane. |
| `classic.SessionStart` with `source=clear`, `resume` or `fork` | Reloads the stored data and registers `/news` again, because those reset the mod's state without a `session.start`. |

### Network hosts

The mod contacts the hosts of your enabled sources and nothing else. The factory sources use `www.anthropic.com`, `github.com`, `status.claude.com` (off by default), `hnrss.org`, `news.ycombinator.com` (only when `hnrss.org` fails), `simonwillison.net`, `news.smol.ai` and `github.blog`. Each source you add contacts its own host, and `/news add` and `/news add-page` contact the address you give before they save it. Haiku calls go through Claude Code with your session's credentials. Stack detection reads local files and contacts no host.

### Commands the mod runs

`$.process.run` starts a program with an argument vector and no shell of its own. Text for the clipboard goes to the program's standard input, never into the arguments.

| Purpose | Argument vector |
|---------|-----------------|
| Detect macOS | `uname -s` |
| Open on macOS | `open <url>` |
| Open on Windows | `rundll32 url.dll,FileProtocolHandler <url>` |
| Open elsewhere | `sh -c 'xdg-open "$1" >/dev/null 2>&1 &' sh <url>`, so the address is the positional argument `$1` and is never part of the script |
| Copy on macOS | `pbcopy` |
| Copy on Windows | `powershell -NoProfile -NonInteractive -Command "[Console]::InputEncoding = [System.Text.Encoding]::UTF8; $t = [Console]::In.ReadToEnd(); Set-Clipboard -Value $t"`, then `clip.exe` |
| Copy elsewhere | `wl-copy`, then `xclip -selection clipboard`, then the PowerShell command above as `powershell.exe`, then `clip.exe` |

The mod opens only addresses that parse as http or https, and it uses the parsed form.

### Files stack detection reads

Stack detection uses `$.fs.list` and `$.fs.read` and writes no file. It finds the project root by listing the session's directory and each directory above it until one holds `.git`, and it stops before your home directory (`HOME`, else `USERPROFILE`), so a `.git` at or above home is not a project. Without a `.git` the root is the session's directory and nothing below it is listed.

Below a root with a `.git`, it lists directories breadth first to depth 4 and at most 500 listings, not counting the search for the root. It does not follow links and skips dot-directories, `node_modules`, `vendor`, `venv`, `__pycache__`, `target`, `dist`, `build`, `_build`, `deps` and `Pods`. A manifest's workspace patterns can add directories to list, but only inside the project.

It reads only files with these names, each up to 4 MiB, and ignores the rest:

| Ecosystem | Files |
|-----------|-------|
| npm | `package.json`, `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `yarn.lock` |
| Python | `pyproject.toml`, `requirements*.txt`, `uv.lock`, `poetry.lock` |
| Go | `go.mod`, `go.work` |
| Rust | `Cargo.toml`, `Cargo.lock` |
| Ruby | `Gemfile`, `Gemfile.lock` |
| PHP | `composer.json`, `composer.lock` |
| .NET | `*.csproj`, `*.fsproj`, `*.vbproj`, `Directory.Packages.props` |
| Java | `pom.xml`, `build.gradle`, `build.gradle.kts`, `libs.versions.toml`, `gradle.properties` |
| Swift | `Package.swift`, `Package.resolved` |
| Dart | `pubspec.yaml`, `pubspec.lock` |

It stores the dependency names, versions and ranges, the paths of the manifests and a hash of each file's text in `$.store`.

### Untrusted content

Feed and page text comes from the internet, and the mod treats it as data.

- The prompts for summaries and page extraction say that the text is untrusted and not an instruction. They put it between markers, and the marker name is lengthened until it does not occur in the text, so the text cannot close the marker.
- Items extracted from a page are kept only with a non-empty title (at most 200 characters) and an http or https address (at most 2048 characters). Relative addresses resolve against the page. A page contributes at most 30 items.
- A feed title is cleaned when the feed is parsed: control characters dropped, whitespace collapsed to one line, at most 300 characters. Before the band and the pane draw a title, a summary or a source glyph, they also remove zero-width and bidirectional characters. The new-item toast uses the parsed title without that second step.
- The headline is a link only for an http or https address, and Open refuses any other. A feed's address is not checked beyond that.
- Source names, and each value the copy template inserts, are reduced to one line without control characters.

## Your stack (in progress)

Stack detection runs at session start and stores the project's dependencies; nothing is shown yet.

## Deviations from the original design

| Original design | What the mod does | Why |
|-----------------|-------------------|-----|
| The plugin takes the repository's name, `claude-code-news-mod` | The plugin is `news`. | `claude plugin validate` refuses plugin names that start with `claude-`. |
| `[` and `]` page the band | `p` and `n` page the band. | The engine accepts only a lowercase letter or a digit as a hotkey, and a digit on the band also fires from an empty prompt, so the band uses letters. |
| Copy with `pbcopy`, `wl-copy`, `xclip` or `clip.exe` by operating system | Copy uses `$.ui.copy` first. It falls back to those tools, and to PowerShell on Windows and WSL, when `$.ui.copy` copies nothing for a reason other than a refusal. | `$.ui.copy` writes to the clipboard of the surface you pressed on and needs no external tool. |
| One tab per source plus Saved, with digit hotkeys by position | The sources take `1` to `9` by position and the Saved tab is always `0`. | Saved keeps one key however many sources you follow. |
| The pane relies on the engine's scrolling | The pane draws only the items that fit, centred on the selection, and `j` and `k` move the window. | The mod does not need to call `$.ui.scroll`. |
| Band header with `◀` `▶` `⏸` | The band draws those glyphs as specified. | Some terminals draw `◀`, `▶` and `⏸` as two-cell emoji, which can misalign the header. The mod keeps the glyphs from the design. |
| A long summary has 3 to 5 lines | A long summary has 3 to 5 lines, or 1 or 2 when the model's reply has fewer than three sentences. | The mod does not pad a short reply. |
| `/news reset` has no further definition | `/news reset` is a factory reset that keeps your saved items. | It brings back the sources you removed and the settings you changed, and your saved items are your own data. |
| An item's date in the pane | The pane shows dates as `Oct 8`, in UTC. | The date does not depend on the machine's time zone. |
| The pane summarizes what it shows | The first `/news` of a session, before the pane has been drawn, summarizes up to 20 items. | The mod learns how many rows fit only when the pane is drawn. |

## Limitations

- **The Linux opener's exit code is not checked.** The mod starts `xdg-open` detached through `sh`, so a missing `xdg-open` shows no error. The headline link still works.
- **`$.process.run` is available in the CLI only.** On the Desktop app, Open and the clipboard fallback can fail with a toast. Copy uses `$.ui.copy` first, and the headline link opens the item.
- **The `clip.exe` fallback can garble non-ASCII text.** It reads the OEM code page. The mod tries PowerShell first on Windows and WSL.
- **The mod sets no request headers.** A feed that needs a specific User-Agent, or answers with a redirect that `$.http.fetch` does not follow, shows as a failed source in `/news list`.
- **`$.http.fetch` cannot be aborted.** A request that hangs counts as failed for its source after 90 seconds, but it keeps running until it ends.
- **The mod has no host allowlist and does not block private addresses.** `/news add` and `/news add-page` fetch any http or https address you give, including `localhost` and addresses on your network. If `$.http.fetch` follows redirects, a redirect can lead to such an address too.
- **A web-fetch policy of your organization can refuse the fetches.** The sources then show as failed.
- **Every session refreshes on its own.** Two open sessions fetch each source twice per interval, and they share one store.
- **The summary cache holds 300 entries.** An item pushed out of it is summarized again when it is shown.
- **Hotkeys need keyboard focus** on the band or the pane.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| The band does not appear. | The band is drawn once an enabled source has items, so wait for the first refresh. Run `/news list` to see each source's item count and last error. The band is also hidden while a Claude Code survey shows. |
| `/news` does nothing visible. | Run `/plugin` and look for `news` on the `mods active` line. If it is missing, run `/reload-plugins`. |
| A source shows an error in `/news list`. | The source failed its last fetch, and the mod keeps its older items. See [Limitations](#limitations) for redirects, headers and fetch policy. |
| Pressing a hotkey types the letter into the prompt. | The band or the pane does not have keyboard focus. Open the pane with `/news`. |
| A summary shows `…` for a long time. | The summary is waiting for a model call. A failed call is retried the next time the item is shown. |

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

Installed copies update only when `version` in `.claude-plugin/plugin.json` changes, because the manifest pins it. A new `calls:` entry in the output of `claude plugin validate .` needs a matching row in the [permissions table](#calls). `CLAUDE.md` describes the layout of `hooks/`, the rules the engine's static analysis enforces and the test conventions.
