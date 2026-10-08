# Reference

This page lists Herald's terms, commands, sources, templates, summary settings, model calls, stored data and limitations. For the band and the pane, see [Band and pane](band-and-pane.md). For release tracking, see [Your stack](your-stack.md).

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
| Show level | The per-project setting that chooses which releases of your stack the band and the pane show. `/herald deps level` sets it. See [Show and toast levels](your-stack.md#show-and-toast-levels). |
| Toast level | The per-project setting that chooses which new releases of your stack raise a toast. `/herald deps toast` sets it. See [Show and toast levels](your-stack.md#show-and-toast-levels). |
| Band | The Herald rows drawn above the prompt. See [Band](band-and-pane.md#band). |
| Compact band | The one-item form the band takes when its column is narrower than 65 cells. See [Compact band](band-and-pane.md#compact-band). |
| Pane | The panel `/herald` opens, with a tab per source, All, Your stack and Saved. See [Pane](band-and-pane.md#pane). |
| Window | The rows of the active pane tab that fit on screen, around the selected item. |
| Advisory id | A security advisory number, such as `CVE-2024-3651` or `GHSA-jfh8-c2jp-5v3q`. |
| Unresolved | A package whose GitHub repository the mod could not find, so nothing shows for it. |

## Commands

Every command replies with text as well as updating the drawing. A missing or invalid argument replies with the usage and changes nothing.

| Command | Argument | What it does |
|---------|----------|--------------|
| `/herald` | none | Opens the pane. Where no surface draws panes, lists the latest three items of each enabled source. |
| `/herald add <url> [name]` | A feed address and an optional name | Follows an RSS or Atom feed after checking that it fetches and has entries. The name defaults to the feed's title. |
| `/herald add-page <url> [name]` | A page address and an optional name | Follows a web page that fetches as HTML. Haiku reads its headlines when the page changes. |
| `/herald remove <name\|url>` | A source's name (any case), id or address | Stops following the source and forgets its items, seen, read and viewed ids and page hash. Saved items stay. |
| `/herald list` | none | Lists every source: on or off, kind, item count, name, address and its last error. |
| `/herald enable <name>` | A source's name | Turns a source on and refreshes it. |
| `/herald disable <name>` | A source's name | Turns a source off. It is kept but no longer fetched or shown. |
| `/herald interval <minutes>` | 1 to 1440, default 5 | Sets the minutes between refreshes and refreshes now. |
| `/herald rotate <seconds>` | 5 to 3600, default 20 | Sets the seconds between band pages. |
| `/herald summaries [on\|off]` | `on` or `off`, default `off`; none to see the current value | Turns [automatic summaries](#summaries-and-languages) on or off. On writes a one-line summary under the headlines shown at once. |
| `/herald lang <feed\|user\|code>` | `feed`, `user` or a language code such as `es` or `pt-BR`, default `feed` | Sets the [summary language](#summaries-and-languages). |
| `/herald template <text>` | Text with `{title}`, `{url}` or `{source}` | Sets the [copy template](#copy-template). |
| `/herald deps [subcommand]` | A subcommand and its argument, or none | Shows and tunes [your stack](your-stack.md) for the project you are in. Every subcommand is in [Commands for your stack](your-stack.md#commands-for-your-stack). |
| `/herald reset` | none | Restores the factory sources and the default settings, the release template included, so automatic summaries are off again. It keeps your saved items and your stack. |
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

GitHub release feeds title an entry with the bare tag. Where the source is not implied (the compact band without its source, the Saved tab and the new-item toast), a title that is only a version (`v0.3.293`, `1.12.0-rc.1`, `2026-07-28`, `Release 7.3.1`) is drawn with the source's name before it, for example `Claude Code v2.1.293`; the full band names the source in its column instead. A source's own tab keeps the bare tag, and the stored title does not change. A title that names a package (`@scope/pkg@1.2.3`) or says more than a version is left as it is.

To follow a GitHub repository's releases as a news source, add its feed: `/herald add https://github.com/OWNER/REPO/releases.atom`. To follow it as part of [your stack](your-stack.md), with a version comparison and flags, run `/herald deps add OWNER/REPO`.

Each source keeps its 30 newest items. An item is identified by its source and its guid, id or link, so a repeated item appears once. Within a source, an entry with no guid (whose id comes from its link) folds into the entry with a guid at the same address (scheme and host in any case, no fragment, no trailing slash, query kept), keeping the id already stored (the guid entry's id when both are stored), so a source that falls back to its second address (such as Hacker News) does not list a story twice, and copies already stored fold together on the next refresh. Entries that each have a guid never fold, even when they share an address. A source whose fetch fails keeps its last items and retries at the next refresh; the reason shows in `/herald list`. A page source has no feed to parse: the mod turns the page into text and asks Haiku for a JSON list of `title`, `url`, `date` and `teaser`, only when the page text or the extraction prompt has changed, and drops malformed entries. The teaser is the one-line description the page shows under a headline, copied as written, at most 200 characters; it is the item's text, and an item from a page that shows none has no text.

A refresh runs when the session starts and then every 5 minutes, fetching three sources at a time, and then refreshes your stack within its [limits](your-stack.md#limits-per-refresh). When it finds new items, one toast names them, for example `3 new: Title …`. A source's first load shows no toast.

## Copy template

Copy for Claude puts the copy template on the clipboard, or the release template for a release of your stack. The defaults are (a release reads `Claude Code v2.1.293` with its source, because a GitHub release title is a bare tag):

```text
Read this and tell me whether it affects this project: {source} {title} {url}
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

Automatic summaries are off by default: Herald asks Haiku for no summary on its own, the band draws each item on one line and the pane draws no summary under the selected item. Summarize (`s`) still writes a 3 to 5 line summary of the selected item when you press it. `/herald summaries on` turns automatic summaries on, `/herald summaries off` turns them off again, and `/herald summaries` says which is in force. A store from before the setting existed reads as off. Turning them on draws the summaries already cached at once and asks for the rest of the items shown; turning them off draws none, cached ones included, and asks for none. The release checks of [your stack](your-stack.md) are not summaries and run either way.

While automatic summaries are on, the band shows a one-line summary under each headline, the pane under the selected headline only (wrapped onto up to three lines), and both show `…` while it is pending. The mod writes summaries from the item's title and the excerpt the feed carries (at most 500 characters), not from the linked page. Link and counter lines (such as Hacker News' `Article URL`, `Points` and `# Comments`) are left out of the excerpt. An item with no text left, such as a Hacker News link post, a description that is only a link label (such as `Comments`) or a page item without a teaser, gets no summary and no model call: the pane draws its headline alone, and the band leaves its second line empty so the band keeps its height as it turns. Summarize on such an item says there is no text to summarize. A reply that talks about the item or its title instead of the story (such as "according to the title"), or that shows the model's reasoning, is dropped and not kept, and the item is asked about again the next time it is shown. After two such replies for the same item, language and length, the mod stops asking for an hour and shows no summary line for the item meanwhile.

`/herald lang` sets the language of every summary:

| Value | Summaries are written in |
|-------|--------------------------|
| `feed` (default) | The language of the item itself. |
| `user` | The language of Claude Code's `language` setting. Without that setting, the item's own language. |
| A code such as `es` or `pt-BR` | That language, whatever the item's language. |

The mod keeps one summary per item, language and length. Changing the language summarizes the shown items again in the new one, and a summary already kept in that language is reused. A summary written by an older version of the mod's prompts is not reused; it leaves the cache as newer summaries push it out.

## Haiku calls and cost

The mod calls Haiku through your Claude Code session, so the calls count against your plan or are billed to your API key. Each call is small: one-line summaries are capped at 120 output tokens, long summaries at 400, page extraction at 6000 and a release check at 60, with timeouts of 20, 45, 60 and 20 seconds. At most two model calls are in flight at once, and a refresh extracts from at most three page sources at a time.

| Call | When it happens |
|------|-----------------|
| One-line summary | Only while automatic summaries are on (`/herald summaries on`; off by default): for each new item with text a refresh finds, newest first, at most 12 per run; for each item with text on a band page and in the pane's window, the selected item first. The first `/herald` of a session, before the pane has been drawn, summarizes up to 20 items. |
| Long summary | Only when you press Summarize on an item with text, whether automatic summaries are on or off. |
| Page extraction | When a page source's text, or the extraction prompt, has a different hash from the last extraction. |
| Release check | One call per release, to flag it from its notes. For releases a refresh has not seen before, never on a package's first read: at most 12 per run, notes cut to 4000 characters. For release rows the band or the pane shows that have no verdict yet: at most 12 per view, notes cut to 1000 characters. |

The mod caches every summary (by item, language, length and prompt version) and every release verdict (by release id), so it asks for each once while it stays cached. A failed call, or a reply that talks about the item instead of the story, is retried the next time the item is shown, except that after two such replies for an item the mod waits an hour before asking again; after the model gives no answer for a release, a view waits an hour before asking again. A release gets no check when the keywords already flag both breaking and security with an advisory id, or after two malformed answers. Release checks follow the number of new releases of the packages you follow, not the time: a quiet day costs none, and a refresh run makes at most 12.

To make fewer calls, see [Reduce Haiku calls](how-to.md#reduce-haiku-calls).

## Stored data

The mod keeps its data in `$.store`, which every Claude Code session on the machine shares, and reloads what the drawings need after `/clear`, `/resume` and `/branch`.

| Key | Holds |
|-----|-------|
| `sources` | Every source, factory or added, with its on or off state. |
| `settings` | Refresh interval, rotation seconds, summary language, whether automatic summaries are on (`autoSummaries`; missing means off), copy template and release template. |
| `saved` | Your saved items. |
| `seen` | The newest 300 item ids per source. |
| `read` | The newest 300 ids per source of the news items you opened, copied for Claude or marked as read on Saved. |
| `viewed` | The newest 300 ids per source of the items its tab held when you last looked at it, or that All drew in its window, what its new count is measured against. |
| `items` | The last items of each source, at most 30. |
| `pageHashes` | The hash of each page source's text, with the extraction prompt, at its last extraction. |
| `refreshedAt` | When each source last refreshed without an error, what the pane's `last update` counts from. |
| `summaries` | The summary cache, at most 300 entries, the oldest dropped first, each with the version of the prompts that wrote it. An item pushed out, or summarized by an older version, is summarized again when it is shown. |
| `deps` | Per project root, at most 20 projects (the least recently detected is dropped): stack settings, followed packages, packages you ignored and added (at most 500 each), a hash of each manifest and lockfile read, and the detection time. |
| `depFeeds` | The release feed of each package, by `<ecosystem>:<name>`, with negative results and your `deps map` mappings. A looked-up mapping is trusted for 7 days, and at most 500 are kept; a mapping you set never expires or counts toward the 500. |
| `releaseFlags` | Haiku's verdict for each release, by release id. At most 500, the oldest dropped first. |
| `stack` | Per project root, at most 5 projects (the least recently refreshed is dropped): each followed package's newest 5 releases (at most 100 per project, notes cut to 1000 characters), its last 10 release ids seen, and when its feed was last read. |

`/herald reset` restores the factory sources, with their factory on or off state, and the default settings, and removes the sources you added with their items, seen, read and viewed ids, page hashes and refresh times. It keeps your saved items and leaves `deps`, `depFeeds`, `releaseFlags` and `stack` as they are, your `deps map` mappings included.

On Claude Code 2.1.293 the store file was observed at `~/.claude/plugins/store/herald_<source>-<id>.json` (`herald_inline-…json` for a `--plugin-dir` load). Claude Code's documentation does not name this file, so the path is observed, not documented. To delete it, see [Delete stored data](how-to.md#delete-stored-data). The store is kept per plugin name, so a store from before the mod was renamed from news to Herald is not read and is not migrated.

## Limitations

- **The Linux opener's exit code is not checked.** The mod starts `xdg-open` detached through `sh`, so a missing `xdg-open` shows no error. The headline link still works.
- **`$.process.run` is available in the CLI only.** On the Desktop app, Open and the clipboard fallback can fail with a toast. Copy uses `$.ui.copy` first, and the headline link opens the item.
- **The `clip.exe` fallback can garble non-ASCII text.** It reads the OEM code page. The mod tries PowerShell first on Windows and WSL.
- **Source fetches add no headers of their own.** Claude Code may add its own, and its documentation does not say which. Registry and release feed requests send the `User-Agent` in [What leaves your machine](security.md#what-leaves-your-machine). A feed that needs a specific User-Agent shows as a failed source in `/herald list`.
- **`$.http.fetch` cannot be aborted.** A request that hangs counts as failed for its source after 90 seconds, and a stack registry or feed request after 30 seconds, but it keeps running until it ends. Turning a refresh off or restarting it waits for the request in progress to fail.
- **The mod has no host allowlist and does not block private addresses.** `/herald add`, `/herald add-page` and `/herald deps map <package> <feed-url>` fetch any http or https address you give, including `localhost` and addresses on your network. Redirects are followed, so a redirect can lead to any host, those included.
- **A web-fetch policy of your organization can refuse the fetches.** The sources then show as failed.
- **Every session refreshes on its own.** Two open sessions fetch each source twice per interval, look up and read your stack twice, and share one store. The one hour pause after a failure is not shared.
- **Hotkeys need keyboard focus** on the band or the pane.
- **One page size for every surface.** With the band drawn on two surfaces of different widths at once, one compact and one full, paging follows the one drawn last.
- **Switching pane tabs does not redraw the band.** Claude Code tells a mod when its pane opens or closes, not when you switch to another mod's pane tab, so after switching away from the Herald pane the band comes back at its next redraw: the next rotation, refresh or resize.
