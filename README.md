# Herald

**News and releases for your stack, right above the prompt.**

![Claude Code 2.1.287 or later](https://img.shields.io/badge/Claude%20Code-2.1.287%2B-d97757) [![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Herald is a Claude Code mod, a plugin that draws its own interface inside Claude Code. It keeps you up to date on Claude, the tools around it and the packages your project depends on, without leaving the terminal.

- The **band** is the rotating lines above the prompt. It shows the latest headlines and flags the releases of your dependencies that are breaking or security fixes.
- The **pane** is the window `/herald` opens. It has a tab for each source, plus Your stack and Saved.

Herald starts with sources such as Anthropic news, the Claude Code releases and Hacker News, and you can add your own RSS or Atom feeds and web pages ([Sources](docs/reference.md#sources)). It also reads your project's manifests and lockfiles, follows the GitHub releases of each package, and marks the breaking and security ones with `⚠` ([Your stack](docs/your-stack.md)).

![The Herald band above the Claude Code prompt. The first page shows two npm packages flagged with a warning sign for breaking releases, the next package from 14.2.15 to 16.4.0 and jsdom from 25.0.1 to 30.1.2, and a Hacker News headline. The band then turns to the next page of news and releases.](docs/media/hero.gif)

## Install

You need Claude Code 2.1.287 or later, in a terminal or the Desktop app, and a session that can call a model. Herald uses a little Haiku, Claude's small model, under your plan or API key, to check releases and to read web-page sources. Automatic summaries are off by default ([Haiku calls and cost](docs/reference.md#haiku-calls-and-cost)). Run these in your shell, where `herald@claude-herald` is the plugin `herald` from the marketplace `claude-herald`:

```bash
claude plugin marketplace add dieg666/claude-herald
claude plugin install herald@claude-herald
```

If a session is open, run `/reload-plugins` in it. Then run `/herald`: the pane opens at once. Herald starts a refresh when the session starts, and the band appears above the prompt as soon as that refresh has fetched items. Releases of your dependencies join it once Herald has read their feeds. Where nothing is drawn, such as `claude -p`, VS Code and cloud sessions, `/herald` answers with the latest items as text.

To try Herald for one session without installing it, or to update or uninstall it, see [How-to guides](docs/how-to.md).

## First commands

| Command                         | What it does                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `/herald`                       | Opens the pane.                                                               |
| `/herald deps`                  | Shows which packages Herald follows for this project.                         |
| `/herald deps ignore <package>` | Stops following one package, such as `npm:left-pad`.                          |
| `/herald deps off`              | Stops following this project's dependencies and leaves the other sources.     |
| `/herald band off <name>`       | Hides a source from the band only. It is still fetched and stays in the pane. |
| `/herald pane off <name>`       | Hides a source from the pane only. It is still fetched and stays on the band. |
| `/herald disable <name>`        | Stops fetching a source, such as `Hacker News`. `/herald list` shows names.   |
| `/herald add <url> [name]`      | Follows an RSS or Atom feed. `/herald add-page` follows a web page.           |

To run several commands at once, paste several lines. Each line is its own command ([Pasting several commands](docs/reference.md#pasting-several-commands)):

```text
/herald add https://github.com/vercel/next.js/releases.atom Next.js
/herald add https://github.com/vitejs/vite/releases.atom Vite
```

To open an article, press `o` on the selected row, or Ctrl+click the headline (Cmd+click on macOS). The keys work while the band or the pane has the keyboard: press ctrl+x tab or click it. If clicking does nothing in your terminal, select the row and press `o` ([Headline links](docs/band-and-pane.md#headline-links)). For every command and setting, see the [Reference](docs/reference.md#commands).

## Documentation

- [How-to guides](docs/how-to.md): install, update, uninstall, delete stored data, cut Haiku calls and fix problems.
- [Band and pane](docs/band-and-pane.md): what they draw, their keys and the item actions.
- [Your stack](docs/your-stack.md): which packages Herald follows and how it classifies releases.
- [Reference](docs/reference.md): terms, commands, sources, summaries, stored data and limitations.
- [Security and privacy details](docs/security.md): hooks, calls, hosts, files, commands and accepted risks.
- [Privacy policy](docs/privacy.md): what Herald reads, sends and stores, in short.
- [Design decisions and deviations](docs/design.md): why Herald behaves as it does.
- [Development](docs/development.md): run the checks and change the mod. [README media](docs/media/README.md) says how the screenshots and recordings are made.

## What Herald sends, runs, reads and hooks

Herald never reads your prompts, your conversation or what Claude does in your session. It has no telemetry and sends nothing to its author. Its data stays on your machine, in a JSON file in Claude Code's plugin store. Feed and page text is treated as untrusted data, and Copy for Claude only puts text on your clipboard: it never submits a prompt.

**What it sends and where.** Fetch requests go to the news sources you have on and to any feed or page address you add. While Your stack is on, package names (for NuGet and Maven also the version you use) go in the URL path to the registries of your project's ecosystems, and repository paths go to `github.com` for release feeds. To stop that for a project, run `/herald deps off`. Item and release text goes to Haiku through your own Claude Code session. Nothing else leaves your machine.

**Which hosts it contacts** ([Network hosts](docs/security.md#network-hosts)):

- For news: `www.anthropic.com`, `github.com`, `hnrss.org` (with `news.ycombinator.com` as a fallback), `simonwillison.net`, `news.smol.ai`, `github.blog`, and `status.claude.com` if you turn Claude status on.
- For Your stack: `registry.npmjs.org`, `pypi.org`, `crates.io`, `proxy.golang.org` and a few Go import hosts, `rubygems.org`, `repo.packagist.org`, `api.nuget.org`, `repo1.maven.org` and `github.com`.

**What it runs and why** ([Commands the mod runs](docs/security.md#commands-the-mod-runs)). Only fixed programs, each with an argument vector. Text for the clipboard goes to the program's standard input.

- `uname -s`, to tell macOS from other systems.
- `open` (macOS), `rundll32 url.dll,FileProtocolHandler` (Windows) or `xdg-open` (elsewhere, started through `sh -c` with the address as `$1`), to open an http or https link.
- `pbcopy` (macOS), `powershell` and `clip.exe` (Windows), or `wl-copy` and `xclip` (elsewhere), to copy text for Claude.

**What it reads.**

- Package manifests and lockfiles in your project ([Files stack detection reads](docs/security.md#files-stack-detection-reads)).
- The environment values `HOME` and `USERPROFILE`, to stop the project search at your home directory, and `OS`, to tell Windows apart.
- Claude Code's `language` setting, for the language of summaries.

It reads no other environment values and asks for no secrets.

**What each hook does.** It has no hook on prompts, tool calls or the transcript.

- `session.start` loads the stored data, starts the refresh and rotation timers and registers `/herald`.
- `command.run` for `herald` answers `/herald` and its subcommands.
- `ui.render` above the prompt draws the band. It adds the band to what other mods draw there and changes nothing else.
- `ui.render` for the `herald` pane draws the pane.
- `ui.open` and `ui.close` for the `herald` pane redraw the band, which steps aside while the pane shows. They change nothing in the pane itself.
- `SessionStart` on clear, resume or fork reloads the stored data and registers `/herald` again, because those reset the mod's state.

[Security and privacy details](docs/security.md) has every host, file, call and command, and the accepted risks.

## License

MIT, see [LICENSE](LICENSE).
