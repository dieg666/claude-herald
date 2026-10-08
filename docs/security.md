# Security and privacy details

This page is for people who review what the mod reads, runs and contacts. The [README](../README.md#privacy-and-permissions) has the summary and the `calls:` table.

## What leaves your machine

| What | Goes to | When |
|------|---------|------|
| Fetch requests for feeds and pages | The host of each enabled source, and the address you give to `/herald add` or `/herald add-page` | At every refresh, and once when you add a source. |
| Package names, and for NuGet and Maven the version in use, in the URL path | The registries in [Network hosts](#network-hosts) | While a project's stack is on, for packages whose mapping is not cached. |
| The repository path | `github.com`, for `releases.atom` and `tags.atom` | While a project's stack is on, when a feed is due. |
| Item titles and excerpts, page text, release titles and notes | Haiku, through your Claude Code session | For summaries, page extraction and release checks. See [Cost](../README.md#cost). |

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

The mod reads the environment variables `HOME`, `OS` and `USERPROFILE` and writes none. It writes only its own `herald.*` state values (`band`, `items`, `pane`, `saved`, `settings`, `sources`, `stack`, `status`, `summaries`).

## Network hosts

The mod contacts the host of each enabled source, and while a project's stack is on, the hosts below. It contacts no other host. Each source you add contacts its own host, and `/herald add` and `/herald add-page` contact the address you give before they save it. Haiku calls go through Claude Code with your session's credentials.

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
- A feed title is cleaned when the feed is parsed: control characters dropped, whitespace collapsed to one line, at most 300 characters. Before the band and the pane draw a title, a summary or a source glyph, they also remove zero-width and bidirectional characters. The new-item toast uses the parsed title without that second step.
- The headline is a link only for an http or https address, and Open refuses any other. A feed's address is not checked beyond that.
- Source names, and each value a copy template inserts, are reduced to one line without control characters.
- The release notes sent to Haiku for the flag check are untrusted too. The prompt says so, puts the release between markers the text cannot close, and asks for one JSON line with two booleans. The mod keeps nothing else of the reply. The release toast removes zero-width and bidirectional characters from the package name and versions.

## Accepted risks

| What happens | Why it is acceptable | What limits it |
|--------------|----------------------|----------------|
| A release's notes can steer Haiku's flags, so a release shows flagged or unflagged wrongly. | A flag changes how a row looks and whether it toasts, nothing else. | The prompt marks the notes as untrusted data, the mod keeps only two booleans from the reply, and an advisory id always sets `security`. |
| A package's registry entry picks the repository whose releases you read, so its author chooses the text shown. | Rows show a title, versions and cut notes as plain text, and you open a link yourself. | `/herald deps map` replaces the repository, `/herald deps ignore` drops the package, and Open refuses any address but http or https. |
| `/herald add`, `/herald add-page` and `/herald deps map <package> <feed-url>` fetch any http or https address, `localhost` and private addresses included, and redirects are followed, so a redirect can lead there too. | You type the address, and the mod only parses the answer as a feed or a page. | Registry and release feed requests carry only the `User-Agent` above and no credentials. A web-fetch policy of your organization can refuse the fetches. |
| The mod has no host allowlist. | Every host it contacts is a source you enabled, a registry in the table above, or an address you typed. | The hosts are listed above, and the fixed registry hosts take package names in the path only. |
