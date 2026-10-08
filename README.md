# Herald

Herald: news and releases for your stack, right above the prompt.

A Claude Code mod that keeps you up to date on Claude and the tools around it without leaving the terminal. A band above the prompt rotates the latest items from RSS/Atom feeds, web pages and the new releases of the packages your project depends on, each with a headline link, and a one-line Haiku summary under it once you turn [automatic summaries](#summaries-and-languages) on with `/herald summaries on`. `/herald` opens a pane with a tab per source, a Your stack tab and a Saved tab. On the selected item you can open it, show a longer summary, save it for later and copy it for Claude. Factory sources (Anthropic news, release feeds of Claude Code and the SDKs, Hacker News and more) can be disabled or removed, and you can add your own. Every command also answers with text, so it works where nothing is drawn.

## Requirements

- Claude Code 2.1.287 or later. Tested with Claude Code 2.1.293.
- A terminal or the Desktop app to draw the band and the pane. In other places, such as `claude -p`, VS Code and cloud sessions, `/herald` answers with the latest items as text and `/herald deps` lists your stack as text.
- A session that can call a model. Summaries, page headlines and release checks use Haiku through your plan or API key (see [Cost](#cost)). Herald asks for one-line summaries on its own only while automatic summaries are on; they are off by default.

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
| `/herald summaries on` | Writes a one-line Haiku summary under each headline. Off by default; `s` summarizes one item on demand either way. |

## Use the band

The band appears above the prompt once at least one enabled source has items. It lists every enabled source's items and the releases of [your stack](#your-stack) in one list, mixed by source so a busy source such as Hacker News cannot fill a page: the list takes each source's newest item in turn, the newest of them first, round after round, so a page of three never shows two items of one source while another source still has items, and a source with many items gets one place a round, its remaining items filling the later pages. Your stack's releases count as one source. Releases of your stack flagged breaking or security (drawn with `⚠`) go before the mix: the list starts with the newest two of them, however old they are, so a release such as `⚠ jsdom 25.0.1 → 30.1.2` is on the first page even when every news item is newer, and the page's third place still goes to another source. Since releases of your stack are never marked read, those two stay first until you upgrade past them. Further flagged releases take your stack's usual turns in the mix. The other items follow in the mixed order above, and the two places right after the leading releases go to other sources while they have items, so the first page never shows a third release of your stack. A release source (a GitHub `releases.atom` or `tags.atom` feed) puts only its newest release in the band, the newest by date (the first in feed order on a tie), so the band shows `Claude Code v2.1.294` and not `v2.1.293` too; its older releases stay in its pane tab, and the position counts the newest one only. The newest goes by date alone, so a feed that also publishes prereleases shows whichever came last; any other feed, a non-GitHub release feed included, keeps all its items in the band. Items without a date come last. The order depends only on the items and on what you have read, so it stays the same from one turn to the next until an item arrives, leaves or is read; the compact band, one item a page, turns through the sources the same way. The header starts with the name, `Herald` in bold, then the position (`1–3 of N`, joined by an en dash) and only the page and auto buttons, for example `Herald  7–9 of 156    p: ◀  n: ▶  a: ⏸ auto`. The selection buttons, `k: ↑` and `j: ↓`, sit at the end of the actions line, set apart from the actions. The band's height depends only on the width, the item count and whether automatic summaries are on, never on the page or on whether the selected item is saved. With automatic summaries off (the default) each item takes one line; with them on, each takes a second line for its summary (see [Summaries and languages](#summaries-and-languages)). The selected item is marked with `›` and its headline drawn bold: the band cannot tell whether it has the keyboard, so it does not highlight the row. Each row starts with a source column 12 cells wide, so every headline and summary starts in the same column on every page (after the age column too, see below): a news item shows its source's name there, cut with `…` when longer, for example `› Hacker News   Margaret Hamilton has died`. Factory sources show a short label in the band so none is cut: `Anthropic`, `Claude Code`, `Agent SDK`, `Python SDK`, `MCP spec`, `Status`, `Hacker News`, `Willison`, `AINews` and `GitHub`; a factory source you renamed shows your name, and `/herald list` keeps the full names. The pane's tabs use the same short labels. News sources are dim; release sources (a GitHub `releases.atom` or `tags.atom` feed, or any item whose title is only a version) are drawn in the theme's Claude color. A title that is only a version is drawn bare after the name, for example `Claude Code   v2.1.294`, so the name is never repeated. A release of your stack shows its `📦` or `⚠` and the package in the column, a scoped name without its scope when it does not fit (`@astrojs/node` shows as `node`), and `current → new` as the headline, for example `📦 jsdom      25.0.1 → 30.1.2`; a release title that only repeats the package and version (`@astrojs/node@11.1.7`) is left out. A long headline is cut at the right end of the line. In the terminal each button shows its hotkey before its label, for example `p: ◀`. The auto button reads `⏸ auto` while the rotation runs and `▶ auto` while it is paused.

Each row shows its item's age in a column of its own right after the source column, dim and right-aligned in 4 cells, so a headline sits next to its age, for example `› Agent SDK      10h  v0.3.294`: `now` under a minute, then `5m`, `2h`, `1d` to `6d`, `1w` to `4w`, `1mo` to `12mo` and `1y` (rounded down, from the item's own date and the clock). A date a little ahead of the clock (up to a day, a feed's clock or zone running early) reads `now`; a date further ahead, an unparsable one and no date at all leave the column blank. Every row keeps the column, dated or not, so every headline and summary starts in the same cell (22 cells from the left edge: the mark, the 12-cell source column, the age column and their gaps). A release of your stack has its age in the same column after its package. The age is worked out when the band draws, so it refreshes whenever the band redraws (a new page or an arriving item, for example); while the rotation is paused and nothing redraws it can be stale, for example `5m` still showing after ten minutes. The band reads the clock for this (`$.clock.now`, the call the pane already makes for its `last update` time).

While the Herald pane is shown, the band draws nothing of its own, since the pane lists the same items; whatever other mods draw in the band stays. The rotation keeps turning while the band is hidden but asks Haiku nothing for the pages it turns to; when you close the pane the band comes back and the page it shows gets its checks then, and its summaries while automatic summaries are on. A pane that waits for room (opened on a narrow terminal) does not hide the band.

When the band's column is narrower than the full band's actions line at its widest (65 cells with `Saved`; the header needs 42 cells for under ten items and 48 for a hundred or more), the band is compact: one line with the name, the position as `13/156`, the page and auto buttons, then the item's headline cut to fit, for example `Herald 13/156  p: ◀  n: ▶  a: ⏸ auto  Claude Code v2.1.293 adds…`. It shows one item a page, so `p`, `n` and the rotation move one item at a time, and it draws no summary, no selection buttons and no actions. Where the headline's room holds the source column, its gap and 14 cells (28 cells), a news item's source name, cut to 12 cells, comes before the headline, dim or in the release color as in the full band, and a bare version tag follows it bare; narrower, the source is left out and a bare version tag leads with the name instead (`Claude Code v2.1.293`). Whether the source shows depends only on the width and the item count, so it mostly shows when the headline takes a row of its own. The headline is still a link; for the other actions, open the pane with `/herald`. Where the headline would get fewer than 14 cells beside the controls it takes a row of its own, and where even the controls do not fit (38 cells for 100 to 999 items) the name and position, the buttons and the headline take a row each, so the compact band's height too depends only on the width and the item count. The compact band draws an item's age (as in the full band) after the source name, or after the glyph of a release of your stack, only where its room also holds the source column, its gap, the age column with its gap and the headline's 14 cells (34 cells), which depends only on the width and the item count too: in practice when the headline takes a row of its own. An undated item shows no age there and its headline keeps the room.

Hotkeys work while the band or the pane has keyboard focus; otherwise the keys go to the prompt. Press ctrl+x tab to give the keyboard to the Herald pane while it is open (the band is hidden then), or to the band otherwise. A click on the band or the pane gives it the keyboard too, and `/herald` opens the pane with it while the prompt is empty. While the band has focus, Tab moves between its controls, Enter presses the focused one and Esc returns focus to the prompt.

| Key | Button | What it does |
|-----|--------|--------------|
| `p` | ◀ | Shows the previous page of three items (one item in the compact band), wrapping at the start, and pauses the rotation. |
| `n` | ▶ | Shows the next page, wrapping at the end, and pauses the rotation. |
| `a` | ⏸ auto / ▶ auto | Pauses or resumes the rotation. |
| `k` | ↑ | Selects the item above in the page and pauses the rotation. Not in the compact band. |
| `j` | ↓ | Selects the item below in the page and pauses the rotation. Not in the compact band. |

The rotation does nothing when all items fit on one page. The band yields its place while Claude Code shows a survey.

The band skips the news items you have read, opened with `o` or copied with `c`, while any unread item remains; the rest keep the band's order, mixed by source, and the position counts them only, for example `1–3 of 12` once 3 of 15 are read. An item you open or copy leaves the band right away and the next one takes its place. A release source's newest release stands for the source: once you have read it, the source shows nothing in the band until a newer release arrives, and an older release never takes its place. Once every item is read, the band lists them all again, a release source still with its newest release only and the flagged releases of your stack still first. Releases of your stack are never counted as read. The pane's All tab lists the same items in the same order with the read ones kept, dim.

## Use the pane

`/herald` opens the pane and asks for keyboard focus, which Claude Code grants while the prompt is empty. Esc closes the pane. The tab row at the top shows the All tab, a tab per enabled source, then Your stack and Saved. The active tab is drawn as highlighted text, bold and underlined in the theme's inverse colors, and the other tabs are dim buttons with their hotkeys. A source's tab shows the band's short label while the source keeps its factory name (`Claude Code` for Claude Code releases, `Agent SDK` for Claude Agent SDK (TS)), else the name you gave it, so with the default sources and no counts the tabs, All included, need 154 cells to take one line on the terminal and two lines at 100; `/herald list` and the rest of the text keep the full names. Labels are drawn whole, unless cutting the names longer than 16 cells (with `…`, wide characters counting two cells) puts the tabs on fewer lines; a name wider than the pane is always cut to fit one line. A count is a token of its own after the tab's name, not part of it. A source's tab shows how many of its items arrived since you last looked at that tab as a bullet and the number in the accent color, for example `6: Hacker News •14`; Your stack shows how many packages are behind and Saved how many items it holds as a total in dim parentheses, for example `y: Your stack (5)` and `0: Saved (2)`, so a total never reads as new items; no tab shows a count of zero. All counts the new items among the rows it lists, by the same rule as a source tab, for example `l: All •31`; a release source lists only its newest release on All, so two new releases make `•2` on the source's tab and `•1` on All, and Your stack's releases never count. With typical counts (five sources with new items, All with the new items it lists, Your stack and Saved with totals) the default tabs need 182 cells for one line. The token is text beside the tab, not part of its button, so clicking it does nothing. Looking at a source's tab, by switching to it or by opening the pane on it with `/herald`, clears its count (and takes its items out of All's count), and so does leaving it; looking at All clears the counts of the rows it draws instead: opening the pane on it, switching to it, or moving the selection so that the window shows other rows records the rows in the window as viewed, each under its own source, so that source's count and All's count fall by them while the rows outside the window keep counting. A release source shows its newest release only on All, so viewing All clears just that release: the source's tab keeps counting its older new releases while All shows none. Your stack's releases have no new count, so they are never recorded, and a source whose count has not started yet is left as it is. The first time `/herald` opens in a session the window is taken as 20 rows until the pane has drawn. Which tab is active does not change the tab row's layout, except that on a narrow pane, entering a tab whose new count wrapped the tab row can take that line away again, and the window then shows one more row. The tabs take one line when the pane is wide enough and wrap onto more lines otherwise. The title line under them holds the `k: ↑` and `j: ↓` buttons and, at its right end, the window's position in the tab, for example `1–14 of 14`; it does not repeat the tab's name. The pane shows a window of the active tab's items around the selection, one line each with its headline link and, at the right end, its date. The date column is 7 cells wide (a space and 6 cells), right-aligned, on every tab including Your stack, so the dates end at the pane's edge: an item less than a day old shows its age as the band does (`now`, `5m`, `2h`, `23h`), an older one its date in UTC (`Oct 7`, `Sep 28`), and an undated one leaves the column blank. The age is worked out when the pane draws, from the clock, so it refreshes whenever the pane redraws. The selected item is highlighted across the whole row, headline, source name and date, in the theme's inverse colors, and keeps its `›`; the others stay plain, except that a news item you have read, opened with `o` or copied with `c`, has its headline drawn dim, on All, on its source's tab and on Saved. While automatic summaries are on, only the selected item shows its summary, on up to three lines under its headline (none for an item without text); while they are off, no item shows one, and the window keeps the same size either way. A source's own tab shows no source mark, since every row is from it; the Saved tab shows each item's source name in dim text just before the date column, the names ending in one column; a long headline drops the name before it is cut. The Your stack tab shows one row per package instead, grouped by ecosystem, with a summary line and a filter field above them; the field is left out while the tab has no release to filter and no filter in force.

The pane opens on the All tab, first in the tab row, on `l` (the band's `a` is taken by auto, and `l` is a key no band or pane button uses). All lists what the band pages through, in the band's order and built by the same code: the newest two breaking or security releases of your stack first, then every enabled source's items mixed by source, your stack's releases counted as one source, a release source by its newest release only, and items without a date last. Unlike the band it keeps the items you have read, in their place, their headlines drawn dim. Each row starts with the band's source column, 12 cells wide: a news item's source as its short label, dim, or in the theme's Claude color for a release; a release of your stack its `📦` or `⚠` and the package, with `current → new` as its headline. Then come the headline and, at the right end, the date (or the age of an item less than a day old), for example `› Hacker News   Margaret Hamilton has died   Oct 7` or `› Hacker News   Margaret Hamilton has died   2h`. `o`, `s`, `v` and `c` act on the item under the selected row, a release of your stack as they do in the band; All has no filter, like the source tabs, and no `e`. Within a session the pane reopens on the tab it last showed; a new session, `/clear`, `/resume` and `/branch` start again on All.

A dim state line says what happened and what changes it. A source whose last refresh failed keeps its items listed under a line such as `Couldn't refresh: HTTP 503 · last update 2 h ago`, counted from the last refresh that worked, which the store keeps across sessions; a source that never refreshed cleanly shows only the reason, and the line takes one row from the window while it shows. A long reason is cut so that the time stays whole. An empty tab shows its line in place of rows:

| Tab | State line |
|-----|------------|
| All, sources that failed | Above its rows, or in their place when empty: `Couldn't refresh Hacker News: HTTP 503` for one source, `Couldn't refresh 2 sources: Hacker News, GitHub` for more. The time of the last refresh that worked shows on each source's own tab. |
| All, empty | `Nothing from any source yet. Herald checks the sources every 5 min.`, `No source has items right now. Herald checks the sources every 5 min.` once one of them refreshed, `Loading the news…` while a refresh runs, or `Every source is off. /herald enable <name> turns one on.` |
| A source that never loaded | `Nothing from Hacker News yet. Herald checks it every 5 min.`, or `Loading Hacker News…` while a refresh runs |
| A source whose feed is empty | `Hacker News has no items right now. Herald checks it every 5 min.` |
| Saved | `Nothing saved yet. Press v on an item to keep it here.` |
| Your stack, filter with no match | `No package matches "zzz". Clear the filter to see all.` Delete the text in the filter field, or run `/herald deps filter` where the surface has no field. |
| Your stack, turned off | `Your stack is off in this project. /herald deps on turns it on.` |
| Your stack, before the first detection | `Looking for this project's package manifests…` |
| Your stack, nothing detected | `No package manifests found in this project.`, or, with manifests but nothing to follow, `No runtime dependencies to follow. /herald deps dev on follows dev ones too.` or `No dependencies found in this project's manifests.` |
| Your stack, lookups under way | `Checking your stack's releases: 4 of 12 packages so far…`. Lookups and feed reads are spread over refreshes; see [Limits per refresh](#limits-per-refresh). |
| Your stack, no feed for any package | `No release feed found for any of your 3 packages. /herald deps map <package> <owner/repo> sets one.` |
| Your stack, releases below the level | `No release at the minor+ level. /herald deps level all shows every release.` |
| Your stack, nothing new | `Everything in your stack is up to date.`, or, when some packages have no feed, `Everything in your stack is up to date · 2 without a release feed, listed by /herald deps.` |

The band has no state line: with no item from any source or from your stack, it draws nothing of its own, even when every source failed.

The footer at the pane's bottom holds the keys that act on the active tab: `o`, `s`, `v` and `c` on All and on a source's tab; `o`, `s`, `c` and `r` on Saved, whose items are saved already; and `o`, `s`, `v`, `c` and `e` on Your stack. An empty tab has no footer. While the pane does not have keyboard focus the footer starts with `ctrl+x tab to use these keys:`, and once it has focus it shows the keys alone. A docked pane keeps the footer on its last row however few items the tab has, and the window of items is the same size with or without focus. Tab walks the pane's controls in the order drawn: the tabs, All first, `k` and `j`, the filter field on Your stack, then the footer.

| Key | Button | What it does |
|-----|--------|--------------|
| `l` | All | Shows every enabled source's items and your stack's releases in the band's order, the read ones dim. The pane opens on it. |
| `1` to `9` | The first nine source tabs | Shows that source's items. Tabs follow the order of `/herald list`, enabled sources only. |
| `y` | Your stack | Shows the releases of your dependencies. The tab exists once the session's project is known; while the project's stack is off it lists nothing and says how to turn it on. |
| `0` | Saved | Shows your saved items. |
| `k` | ↑ | Selects the previous item. Stops at the first. |
| `j` | ↓ | Selects the next item. Stops at the last. |
| `r` | Mark as read | On the Saved tab only, in place of Save: removes the selected item from the saved list and counts it as read. |
| `e` | Releases / Hide releases | On the Your stack tab only: lists the selected package's releases under it, or hides them again. |

## Act on an item

The same four actions apply to the selected item in the band and in the pane, on All a row's own item, a release of your stack included, except that the pane's Saved tab has no Save, since its items are saved already. On the Your stack tab, a package's row acts on its highest release shown, and a release listed under an expanded package acts on that release.

| Key | Button | What it does |
|-----|--------|--------------|
| `o` | Open | Opens the item's address in your default browser and counts the item as read. The headline is also a link, but a click on it is not counted, since Claude Code does not tell the mod. Addresses that are not http or https are refused. |
| `s` | Summarize | Writes a 3 to 5 line summary under the item's title in the transcript, without starting a turn, whether automatic summaries are on or off. Claude does not read these lines. For a release, the summary comes from its notes. An item without text gets a line that says so instead, with no model call. |
| `v` | Save / Saved | Adds the item to the Saved tab. The button reads Saved for an item already saved, and pressing it changes nothing. |
| `c` | Copy for Claude | Copies the [copy template](#copy-template) filled with the item to the clipboard and shows a "📋 Copied" toast. It never submits a prompt, and it counts the item as read once the text reached a clipboard. The text comes from the feed, so pasting it into the prompt makes it part of your prompt. |

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
| `/herald deps [subcommand]` | A subcommand and its argument, or none | Shows and tunes [your stack](#your-stack) for the project you are in. Every subcommand is in [Commands for your stack](#commands-for-your-stack). |
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

To follow a GitHub repository's releases as a news source, add its feed: `/herald add https://github.com/OWNER/REPO/releases.atom`. To follow it as part of [your stack](#your-stack), with a version comparison and flags, run `/herald deps add OWNER/REPO`.

Each source keeps its 30 newest items. An item is identified by its source and its guid, id or link, so a repeated item appears once. Within a source, an entry with no guid (whose id comes from its link) folds into the entry with a guid at the same address (scheme and host in any case, no fragment, no trailing slash, query kept), keeping the id already stored (the guid entry's id when both are stored), so a source that falls back to its second address (such as Hacker News) does not list a story twice, and copies already stored fold together on the next refresh. Entries that each have a guid never fold, even when they share an address. A source whose fetch fails keeps its last items and retries at the next refresh; the reason shows in `/herald list`. A page source has no feed to parse: the mod turns the page into text and asks Haiku for a JSON list of `title`, `url`, `date` and `teaser`, only when the page text or the extraction prompt has changed, and drops malformed entries. The teaser is the one-line description the page shows under a headline, copied as written, at most 200 characters; it is the item's text, and an item from a page that shows none has no text.

A refresh runs when the session starts and then every 5 minutes, fetching three sources at a time, and then refreshes your stack within its [limits](#limits-per-refresh). When it finds new items, one toast names them, for example `3 new: Title …`. A source's first load shows no toast.

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

Automatic summaries are off by default: Herald asks Haiku for no summary on its own, the band draws each item on one line and the pane draws no summary under the selected item. Summarize (`s`) still writes a 3 to 5 line summary of the selected item when you press it. `/herald summaries on` turns automatic summaries on, `/herald summaries off` turns them off again, and `/herald summaries` says which is in force. A store from before the setting existed reads as off. Turning them on draws the summaries already cached at once and asks for the rest of the items shown; turning them off draws none, cached ones included, and asks for none. The release checks of [your stack](#your-stack) are not summaries and run either way.

While automatic summaries are on, the band shows a one-line summary under each headline, the pane under the selected headline only (wrapped onto up to three lines), and both show `…` while it is pending. The mod writes summaries from the item's title and the excerpt the feed carries (at most 500 characters), not from the linked page. Link and counter lines (such as Hacker News' `Article URL`, `Points` and `# Comments`) are left out of the excerpt. An item with no text left, such as a Hacker News link post, a description that is only a link label (such as `Comments`) or a page item without a teaser, gets no summary and no model call: the pane draws its headline alone, and the band leaves its second line empty so the band keeps its height as it turns. Summarize on such an item says there is no text to summarize. A reply that talks about the item or its title instead of the story (such as "according to the title"), or that shows the model's reasoning, is dropped and not kept, and the item is asked about again the next time it is shown. After two such replies for the same item, language and length, the mod stops asking for an hour and shows no summary line for the item meanwhile.

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

- **Band and Saved rows.** `📦 pkg current → new`, then ` · title` when the title says more than the version; `⚠` replaces `📦` on a flagged release. A second line shows the ecosystem, the level when known, `pre-release` and the flags, for example `npm · major · breaking`; in the band with automatic summaries off, they follow the headline on its one line, dim, as far as the width allows. A row has a flag check and no Haiku summary.
- **Your stack tab.** Press `y` in the pane. Packages are grouped by ecosystem, one row each, in aligned columns: `⚠  jsdom  25.0.1 → 30.1.2  major  breaking in 30.0.0 · 3 releases  Oct 5`. The row shows the version in use, the highest release shown (the highest stable version, a pre-release only when no stable one is shown, so a later backport such as `7.0.3` after `8.0.0` does not replace it), the highest level among the releases shown, each flag with the release that brought it (just `security` when that is the highest), `pre-release` when the highest is one, how many releases are shown when more than one, and the highest one's date, or its age while it is less than a day old, right-aligned at the pane's edge like the date on the other tabs. Only the part of the new version that changed is colored, by that release's own level: red for major (a `0.x` minor is major), yellow for minor, green for patch, none for `unknown`. The selected row is highlighted whole and shows that part in bold instead of in color. `⚠` marks a package with any flagged release shown, `📦` the others. Inside each ecosystem, packages with a flagged release come first, then major, minor, patch and `unknown`, then by the date shown, newest first. A line under the title line counts the packages at the show level, the same number the tab shows, before the filter: `6 packages behind · 2 security · 1 breaking`, leaving out counts of zero. Press `e` to list the selected package's releases under it, indented, one line each with its level, flags and date, and `e` again to hide them; the expanded packages last for the session, like the filter. Every release of the packages in view gets the flag check. The filter field, labelled `Filter (click or Tab)`, gets the keys once you click it or Tab to it. It takes words, up to 100 characters, that must all appear in the package name, ecosystem, level (the package's highest) or a flag of any of its releases shown. Where the surface has no text field (mobile), the filter in force shows as a dim `Filter: …` line, and `/herald deps filter <text>` sets it. The filter lives in session state only: a new session, `/clear`, `/resume`, `/branch` and a change of project start without it.
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
| One-line summary | Only while automatic summaries are on (`/herald summaries on`; off by default): for each new item with text a refresh finds, newest first, at most 12 per run; for each item with text on a band page and in the pane's window, the selected item first. The first `/herald` of a session, before the pane has been drawn, summarizes up to 20 items. |
| Long summary | Only when you press Summarize on an item with text, whether automatic summaries are on or off. |
| Page extraction | When a page source's text, or the extraction prompt, has a different hash from the last extraction. |
| Release check | One call per release, to flag it from its notes. For releases a refresh has not seen before, never on a package's first read: at most 12 per run, notes cut to 4000 characters. For release rows the band or the pane shows that have no verdict yet: at most 12 per view, notes cut to 1000 characters. |

The mod caches every summary (by item, language, length and prompt version) and every release verdict (by release id), so it asks for each once while it stays cached. A failed call, or a reply that talks about the item instead of the story, is retried the next time the item is shown, except that after two such replies for an item the mod waits an hour before asking again; after the model gives no answer for a release, a view waits an hour before asking again. A release gets no check when the keywords already flag both breaking and security with an advisory id, or after two malformed answers. Release checks follow the number of new releases of the packages you follow, not the time: a quiet day costs none, and a refresh run makes at most 12.

To cut the cost, leave automatic summaries off (the default) or run `/herald summaries off`; pause the rotation with `a` (each band page it reaches gets its checks, and its summaries while they are on, except while the Herald pane is shown) or run `/herald rotate 3600`; run `/herald deps off` to stop all stack requests and calls; lower `/herald deps cap`, `ignore` packages or raise `/herald deps level` to check fewer releases. `/herald deps toast off` cuts nothing, because the check on new releases runs whatever the toast level.

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
| `$.store.get` | Reads the [stored data](#stored-data). |
| `$.store.set` | Writes the stored data. |
| `$.ui.copy` | Puts the filled template on the clipboard of the surface you pressed on. |
| `$.ui.log` | Debug lines, and the lines of a long summary in the transcript. |
| `$.ui.invalidate` | Draws the band again when the pane opens or closes, so it hides beside the pane and comes back after. |
| `$.ui.open` | Opens the `/herald` pane. |
| `$.ui.panes` | Whether the Herald pane is open and shown, so the band draws nothing beside it. |
| `$.ui.resolve` | The `Box`, `Text`, `Button` and `Link` elements the band and the pane draw with, and the `Input` of the stack tab's filter where the surface has one. |
| `$.ui.toast` | The new-item, new-release and "Copied" toasts, and action errors. |

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

On Claude Code 2.1.293 the store file was observed at `~/.claude/plugins/store/herald_<source>-<id>.json` (`herald_inline-…json` for a `--plugin-dir` load). Claude Code's documentation does not name this file, so the path is observed, not documented. To delete everything the mod stored, quit Claude Code and delete that file. The store is kept per plugin name, so a store from before the mod was renamed from news to Herald is not read and is not migrated.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| The band does not appear. | It is drawn once an enabled source has items, so wait for the first refresh. `/herald list` shows each source's item count and last error. It is also hidden while a Claude Code survey shows and while the Herald pane is shown. |
| `/herald` does nothing visible. | Run `/plugin` and look for `herald` on the `mods active` line. If it is missing, run `/reload-plugins`. |
| A source shows an error in `/herald list`, or `Couldn't refresh` in the pane. | It failed its last fetch, and the mod keeps its older items and tries again at the next refresh. See [Limitations](#limitations) for headers and fetch policy. |
| A release does not show. | It is at or below your version; it is a patch release and the show level is `minor+`; it is a pre-release and the show level is not `all`; its package waits for a lookup (10 per refresh), is paused for an hour after a failure, or is `unresolved` in `/herald deps`; or the stack is off for this project. |
| A package is `unresolved`. | Its registry names no GitHub repository, GitHub does not have it, or its name is not valid for that registry. Run `/herald deps map <package> <owner/repo\|feed-url>`. |
| A hotkey types the letter into the prompt. | The band or the pane does not have keyboard focus; the pane's footer then starts with `ctrl+x tab to use these keys:`. Press ctrl+x tab (it focuses the open pane, or the band when no pane is open), click the pane, or open it with `/herald` from an empty prompt. |
| No summary shows under the headlines. | Automatic summaries are off by default. Run `/herald summaries on`, or press `s` on an item for a summary of it alone. |
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
- **One page size for every surface.** With the band drawn on two surfaces of different widths at once, one compact and one full, paging follows the one drawn last.
- **Switching pane tabs does not redraw the band.** Claude Code tells a mod when its pane opens or closes, not when you switch to another mod's pane tab, so after switching away from the Herald pane the band comes back at its next redraw: the next rotation, refresh or resize.

## Design notes

| Behaviour | Why |
|-----------|-----|
| The plugin is named `herald` and the marketplace `claude-herald`. | `claude plugin validate` refuses plugin names that start with `claude-`; a marketplace name may. |
| `p` and `n` page the band. | Claude Code accepts only a lowercase letter or a digit as a hotkey, and a band digit also fires from an empty prompt. |
| Copy uses `$.ui.copy` first, then `pbcopy`, `wl-copy`, `xclip` or `clip.exe` by system (PowerShell on Windows and WSL), when `$.ui.copy` copies nothing for a reason other than a refusal. | `$.ui.copy` writes to the clipboard of the surface you pressed on and needs no external tool. |
| Source tabs take `1` to `9` by position, Your stack is `y`, Saved is `0`. | Saved keeps one key however many sources you follow. |
| The Your stack tab lists releases under a package on `e`, not `r`. | `r` is Mark as read on the Saved tab, and the pane keeps every hotkey distinct. |
| The pane draws only the items that fit, centred on the selection. | The mod does not need to call `$.ui.scroll`. |
| The band header draws `◀` `▶` `⏸` as they are, and release rows draw `📦` and `⚠` two cells wide at the start of the source column, before the package. | Some terminals draw `◀` `▶` `⏸` as two-cell emoji, which can misalign the header; `📦` is two cells, so a one-cell glyph is padded and headlines still align. |
| Automatic summaries are off by default. | Each one-line summary is a Haiku call against your plan or API key, made for items you may never read; Summarize asks only when you press it. |
| A long summary has 3 to 5 lines, or 1 or 2 when the model's reply has fewer than three sentences. | The mod does not pad a short reply. |
| The pane shows a date as `Oct 8`, in UTC, once the item is a day old. | The date does not depend on the machine's time zone. |
| The pane shows an item less than a day old as its age (`now`, `5m`, `2h`), in the same column as a date. | A date such as `Oct 8` says nothing for today's items, and the age is the band's own, from the same code. |
| With automatic summaries on, the first `/herald` of a session summarizes up to 20 items before the pane is drawn. | The mod learns how many rows fit only when the pane is drawn. |
| A release row gets a flag check, not a summary. | Its level and flags come from the classification, and Summarize still writes a summary of the notes. |
| The release template is one setting for all projects; levels, cap and dev toggle are per project. | The template sits beside the copy template, and `/herald reset` restores both. |
| The terminal draws a tab's hotkey and name as `n: name`, and the count as a separate token after it. | Claude Code draws a plain Button's hotkey itself, accent-colored, with a colon, and its label is one string, so neither the colon nor a colored count inside the label can be changed; the count is a sibling element. The `n: ` prefix takes three of each tab's cells, 36 of the 154 the default tabs need with All, so 138 columns do not hold them on one line. |
| A source tab's count is the items its tab did not hold when you last looked at it, kept as ids, not timestamps. | Ids need no first-seen time per item and no trust in a feed's dates, which can be missing, wrong or in the future. |
| A source's count starts from its first refresh with items: the items it loads then (or, for a source followed before counts existed, the items it already had) count as looked at. | A new install or an upgrade does not open with every tab at 30; only items that arrive later count, as with the new-item toasts. |
| Read means opened with `o` or copied with `c`, not shown. | An item that scrolled past in the band or the pane may not have been read. |
| The band leaves read items out instead of moving them to the end. | Its position and height count only what it rotates through; once every item is read it lists them all again. |

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
