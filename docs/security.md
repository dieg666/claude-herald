# Security and privacy details

This page is for people who review what the mod reads, runs and contacts. The [README](../README.md#privacy-at-a-glance) has the summary.

## What leaves your machine

| What | Goes to | When |
|------|---------|------|
| Fetch requests for feeds and pages | The host of each enabled source, and the address you give to `/herald add` or `/herald add-page` | At every refresh, and once when you add a source. |
| Package names, and for NuGet and Maven the version in use, in the URL path | The registries in [Network hosts](#network-hosts) | While a project's stack is on, for packages whose mapping is not cached. |
| The repository path | `github.com`, for `releases.atom` and `tags.atom` | While a project's stack is on, when a feed is due. |
| Item titles and excerpts, page text, release titles and notes | Haiku, through your Claude Code session | For summaries, page extraction and release checks. See [Haiku calls and cost](reference.md#haiku-calls-and-cost). |

Every model call asks for the alias `haiku`. Claude Code resolves the alias and checks it against its model allowlist as it does a `--model` value, so the exact model is whichever one your Claude Code maps `haiku` to.

Registry and release feed requests carry one header of the mod's own, `User-Agent`, and no cookies or credentials:

```text
herald-claude-code-mod (a Claude Code plugin looking up release feeds of project dependencies)
```

The mod's source fetches send no headers of their own. Claude Code may add its own to any request, and its documentation does not say which. Each registry lookup has a fixed host, and the package name goes in the path only, percent-encoded. For PyPI, crates.io, RubyGems, Packagist, NuGet and Maven, a name with characters outside letters, digits, `.`, `_` and `-` (crates: `_` and `-`), a name of dots only, or a malformed Maven or Packagist coordinate stays unresolved as `not a valid <ecosystem> name`, with no request. Each registry or feed request has a 30-second deadline. For Go, the module path must match a module-path pattern, the vanity lookup runs only for the ten hosts below, and the result must be a GitHub repository, or the module stays unresolved.

## What the mod never reads

The mod does not read your prompts, the conversation or your tool calls. The `hooks:` line of `claude plugin validate <plugin folder>` lists every event it listens to:

```text
./register.tsx hooks: session.start, command.run{command=herald}, ui.render{component=AbovePrompt}, ui.render{component=Pane, requestId=herald}, classic.SessionStart{source=clear|resume|fork}
```

It hooks no `prompt.submit`, no `tool.call` and no transcript event. The only files it reads are the manifests and lockfiles in [Files stack detection reads](#files-stack-detection-reads).

| Hook | What it does |
|------|--------------|
| `session.start` | Loads the stored data, starts the refresh and rotation timers, schedules stack detection and the first refresh of your stack, and registers `/herald`. |
| `command.run` with `command=herald` | Runs `/herald`, `/herald deps` and the other subcommands, and answers with text. |
| `ui.render` with `component=AbovePrompt` | Draws the band and keeps what other mods draw there. |
| `ui.render` with `component=Pane` and `requestId=herald` | Draws the `/herald` pane. |
| `classic.SessionStart` with `source=clear`, `resume` or `fork` | Reloads the stored data and the stack's releases and registers `/herald` again, because those reset the mod's state without a `session.start`. |

The mod reads the environment variables `HOME`, `OS` and `USERPROFILE` and writes none. It writes only its own `herald.*` state values (`band`, `items`, `pane`, `read`, `saved`, `settings`, `sources`, `stack`, `status`, `summaries`, `viewed`).

## Calls

`claude plugin validate .` lists these calls on its `calls:` line, and each has a reason here.

| Call | Why the mod needs it |
|------|----------------------|
| `$.clock.after` | Deadlines for fetches and refresh runs, waits between retries, scheduling stack detection. |
| `$.clock.every` | The refresh timer and the band rotation timer. |
| `$.clock.now` | Timestamps for saved items, refresh runs, feed mappings, feed reads and failures, the pane's `last update` time, the age drawn after each band row and the age of an item less than a day old in the pane's date column. |
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
| `$.store.get` | Reads the [stored data](reference.md#stored-data). |
| `$.store.set` | Writes the stored data. |
| `$.ui.copy` | Puts the filled template on the clipboard of the surface you pressed on. |
| `$.ui.log` | Debug lines, and the lines of a long summary in the transcript. Debug lines go to Claude Code's debug log alone (`claude --debug` or the `--debug-file`), led by the plugin's name, and nothing shows on screen. Transcript lines are drawn as dim notices and are not sent to the model. |
| `$.ui.invalidate` | Draws the band again when the pane opens or closes, so it hides beside the pane and comes back after. |
| `$.ui.open` | Opens the `/herald` pane. |
| `$.ui.panes` | Whether the Herald pane is open and shown, so the band draws nothing beside it. |
| `$.ui.resolve` | The `Box`, `Text`, `Button` and `Link` elements the band and the pane draw with, and the `Input` of the stack tab's filter where the surface has one. |
| `$.ui.toast` | The new-item, new-release and "Copied" toasts, and action errors. |

## Network hosts

On its own, the mod contacts only the hosts of the factory sources you have on and, while a project's stack is on, the hosts of your stack below. Every other host it reaches is one you chose: a source you add (`/herald add` and `/herald add-page` contact the address you give before they save it) and a feed address you set with `/herald deps map`. Redirects are followed, so a redirect can lead to any host, and the mod has no host allowlist; see [Accepted risks](#accepted-risks). Haiku calls go through Claude Code with your session's credentials.

The factory sources contact these hosts. [Sources](reference.md#sources) has their full addresses and which ones are on.

| Host | Source |
|------|--------|
| `www.anthropic.com` | Anthropic news |
| `github.com` | Claude Code releases, Claude Agent SDK (TS), Anthropic Python SDK and MCP spec |
| `status.claude.com` | Claude status, off by default |
| `hnrss.org`, and `news.ycombinator.com` when the first fails | Hacker News |
| `simonwillison.net` | Simon Willison |
| `news.smol.ai` | AINews (smol.ai) |
| `github.blog` | GitHub changelog |

Your stack contacts these hosts, and only for the ecosystems and packages your project uses:

| Host | Contacted for |
|------|---------------|
| `registry.npmjs.org` | npm package metadata. |
| `pypi.org` | PyPI project metadata. |
| `crates.io` | Cargo crate metadata. |
| `proxy.golang.org` | The origin of a Go module that is not under `github.com/` or `golang.org/x/`. |
| `gopkg.in`, `go.uber.org`, `k8s.io`, `sigs.k8s.io`, `google.golang.org`, `go.opentelemetry.io`, `go.etcd.io`, `go.yaml.in`, `gotest.tools`, `honnef.co` | A Go module on that host, when the Go proxy names no GitHub origin: its `go-get` page names the repository. Modules on other hosts stay unresolved. |
| `rubygems.org` | RubyGems gem metadata. |
| `repo.packagist.org` | Packagist package metadata. |
| `api.nuget.org` | NuGet package versions and nuspec files. |
| `repo1.maven.org` | Maven Central version lists and pom files. |
| `github.com` | The `releases.atom` or `tags.atom` feed of each repository, `/herald deps add` repositories included. |
| The host of a feed address you give | A feed set with `/herald deps map <package> <feed-url>`. |

The mod makes these requests when a refresh runs, not inside a command. `/herald deps add`, `map`, `on`, `rescan`, `dev`, `cap`, `ignore` and `unignore` start a refresh that runs once the command has answered, and only while the stack is on (for `map`, only when the package is followed). `/herald deps` itself, `level`, `toast`, `template` and `filter` make no request. While a project's stack is off, the mod makes no request for it. Redirects are followed, so a redirect can lead to any host.

## Files stack detection reads

Stack detection uses `$.fs.list` and `$.fs.read` and writes no file. It finds the project root by listing the session's directory and each directory above it until one holds `.git`, and it stops before your home directory (`HOME`, else `USERPROFILE`), so a `.git` at or above home is not a project. Without a `.git` the root is the session's directory and nothing below it is listed.

- **Session started in your home directory, or above it.** The search lists no directory, so there is no `.git` project: the root is that directory alone, and only the manifests directly in it are read.
- **Session started outside your home directory**, such as in `/tmp/demo`. The search goes up until it reaches your home directory or one of its parents, such as `/`, and does not list that one. If neither `HOME` nor `USERPROFILE` is set, it goes up to the filesystem root.
- **Session started at a filesystem root.** There is no project, and stack detection reads nothing.

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

It stores the dependency names, versions and ranges, the paths of the manifests and a hash of each file's text in `$.store`. A package you add with `/herald deps add` is kept in the store, and no file is read for it.

## Commands the mod runs

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

## Untrusted content

Feed, page and release text comes from the internet, and the mod treats it as data.

- The prompts for summaries and page extraction say that the text is untrusted and not an instruction. They put it between markers, and the marker name is lengthened until it does not occur in the text, so the text cannot close the marker.
- Items extracted from a page are kept only with a non-empty title (at most 200 characters) and an http or https address (at most 2048 characters). Relative addresses resolve against the page. A page contributes at most 30 items. An item's teaser is kept only as a string that the page text holds (any case and spacing), reduced to one line without control, zero-width or bidirectional characters, at most 200 characters; it is used only as the text a summary is written from, between the summary prompt's markers.
- A feed title is cleaned when the feed is parsed: control characters dropped, whitespace collapsed to one line, at most 300 characters. Before the band and the pane draw a title, a summary or a source name, they also remove zero-width and bidirectional characters. The new-item toast uses the parsed title without that second step.
- The headline is a link only for an http or https address, and Open refuses any other. A feed's address is not checked beyond that.
- Source names, and each value a copy template inserts, are reduced to one line without control characters.
- The release notes sent to Haiku for the flag check are untrusted too. The prompt says so, puts the release between markers the text cannot close, and asks for one JSON line with two booleans. The mod keeps nothing else of the reply. The release toast removes zero-width and bidirectional characters from the package name and versions.

## Telemetry

The mod has no telemetry. It sends nothing to its author and contacts no analytics or reporting host. To check this yourself:

1. Run `claude plugin validate <plugin folder>` and read the `hooks:` and `calls:` lines. They list every event the mod listens to and every call it makes; [Calls](#calls) gives the reason for each.
2. Compare the hosts the code fetches with [Network hosts](#network-hosts). Every address the mod builds on its own starts with one of those hosts.
3. Watch the traffic of a session, for example through an intercepting proxy, and compare the hosts with that list.

## Accepted risks

| What happens | Why it is acceptable | What limits it |
|--------------|----------------------|----------------|
| A release's notes can steer Haiku's flags, so a release shows flagged or unflagged wrongly. | A flag changes how a row looks and whether it toasts, nothing else. | The prompt marks the notes as untrusted data, the mod keeps only two booleans from the reply, and an advisory id always sets `security`. |
| A package's registry entry picks the repository whose releases you read, so its author chooses the text shown. | Rows show a title, versions and cut notes as plain text, and you open a link yourself. | `/herald deps map` replaces the repository, `/herald deps ignore` drops the package, and Open refuses any address but http or https. |
| `/herald add`, `/herald add-page` and `/herald deps map <package> <feed-url>` fetch any http or https address, `localhost` and private addresses included, and redirects are followed, so a redirect can lead there too. | You type the address, and the mod only parses the answer as a feed or a page. | Registry and release feed requests carry only the `User-Agent` above and no credentials. A web-fetch policy of your organization can refuse the fetches. |
| The mod has no host allowlist. | Every host it contacts is a source you enabled, a registry in the table above, or an address you typed. | The hosts are listed above, and the fixed registry hosts take package names in the path only. |
| Copy for Claude puts feed text on your clipboard, and pasting it into the prompt makes that text part of your prompt, so a feed can try to steer Claude. | Copying never submits a prompt: you see the text in the prompt before you send it. | The template fills each value as one line without control characters, and the default templates ask Claude to assess the item, not to follow it. |
| The new-item toast shows a feed title without the second cleaning step, so zero-width and bidirectional characters can reach it. | A toast is a short notice that takes no action. | The title is already cleaned when the feed is parsed (control characters dropped, one line, at most 300 characters), the toast is cut to a fixed length, and the band and the pane draw the fully cleaned title. |
