# Band and pane

This page describes what the band and the `/herald` pane draw, the keys they take and the actions on an item. For the terms used here, such as compact band, window, show level and toast level, see [Terms](reference.md#terms).

## Band

The band appears above the prompt once at least one enabled source has items. It lists every enabled source's items and [your stack](your-stack.md) in one list, three items a page, and turns the page every 20 seconds (`/herald rotate` changes it). Your stack's releases count as one source, with one row for each followed package rather than for each release.

### Order of items

The list mixes items by source, so a busy source such as Hacker News cannot fill a page:

- **Flagged packages first.** Packages of your stack with a release flagged breaking or security among the ones shown (drawn with `⚠`) go before the mix. The list starts with the newest two of them by their target's date, however old, so a row such as `⚠ jsdom 25.0.1 → 30.1.2` is on the first page even when every news item is newer. Since releases of your stack are never marked read, those two stay first until you upgrade past them. Further flagged packages take your stack's usual turns in the mix.
- **Then the mix.** The list takes each source's newest item in turn, the newest of them first, round after round. A page of three never shows two items of one source while another source still has items, and a source with many items gets one place a round, its remaining items filling the later pages.
- **Room for news on the first page.** The page's third place, and the two places right after the leading releases, go to other sources while they have items, so the first page never shows a third package of your stack.
- **Undated items last.** Items without a date come last.

The order depends only on the items and on what you have read, so it stays the same from one turn to the next until an item arrives, leaves or is read. The compact band turns through the sources the same way.

### Why the band shows one release per source

A release source (a GitHub `releases.atom` or `tags.atom` feed) puts only its newest release in the band, so the band shows `Claude Code v2.1.294` and not `v2.1.293` too. Its older releases stay in its pane tab, and the band's position counts the newest one only.

The newest goes by date (the first in feed order on a tie) and by date alone, so a feed that also publishes prereleases shows whichever came last. Any other feed, a non-GitHub release feed included, keeps all its items in the band.

### Read items

The band skips the news items you have read, opened with `o` or copied with `c`, while any unread item remains. The rest keep the band's order, mixed by source, and the position counts them only, for example `1–3 of 12` once 3 of 15 are read. An item you open or copy leaves the band right away and the next one takes its place.

A release source's newest release stands for the source: once you have read it, the source shows nothing in the band until a newer release arrives, and an older release never takes its place. Once every item is read, the band lists them all again, a release source still with its newest release only and the flagged releases of your stack still first. Releases of your stack are never counted as read. The pane's All tab lists the same items in the same order with the read ones kept, dim.

### Header and keys

The header starts with the name, `Herald` in bold, then the position (`1–3 of N`, joined by an en dash) and only the page and auto buttons, for example `Herald  7–9 of 156    p: ◀  n: ▶  a: ⏸ auto`. The selection buttons, `k: ↑` and `j: ↓`, sit at the end of the actions line, set apart from the actions. In the terminal each button shows its hotkey before its label, for example `p: ◀`. The auto button reads `⏸ auto` while the rotation runs and `▶ auto` while it is paused.

| Key | Button | What it does |
|-----|--------|--------------|
| `p` | ◀ | Shows the previous page of three items (one item in the compact band), wrapping at the start, and pauses the rotation. |
| `n` | ▶ | Shows the next page, wrapping at the end, and pauses the rotation. |
| `a` | ⏸ auto / ▶ auto | Pauses or resumes the rotation. |
| `k` | ↑ | Selects the item above in the page and pauses the rotation. Not in the compact band. |
| `j` | ↓ | Selects the item below in the page and pauses the rotation. Not in the compact band. |

The rotation does nothing when all items fit on one page. For the actions line (`o`, `s`, `v` and `c`), see [Item actions](#item-actions).

### Rows

- **Selection.** The selected item is marked with `›` and its headline drawn bold. The band cannot tell whether it has the keyboard, so it does not highlight the row.
- **Source column.** Each row starts with a source column 12 cells wide, so every headline and summary starts in the same column on every page. A news item shows its source's name there, cut with `…` when longer, for example `› Hacker News   Margaret Hamilton has died`.
- **Short labels.** Factory sources show a short label in the band so none is cut: `Anthropic`, `Claude Code`, `Agent SDK`, `Python SDK`, `MCP spec`, `Status`, `Hacker News`, `Willison`, `AINews` and `GitHub`. A factory source you renamed shows your name, and `/herald list` keeps the full names. The pane's tabs use the same short labels.
- **Colors.** News sources are dim. Release sources (a GitHub `releases.atom` or `tags.atom` feed, or any item whose title is only a version) are drawn in the theme's Claude color. A title that is only a version is drawn bare after the name, for example `Claude Code   v2.1.294`, so the name is never repeated.
- **Packages of your stack.** A package shows its `📦` or `⚠` and its name in the column, a scoped name without its scope when it does not fit (`@astrojs/node` shows as `node`), and `current → target` as the headline, for example `📦 jsdom      25.0.1 → 30.1.2`, with the age of the target release. The target is the package's highest stable version shown, as on the Your stack tab. A release title that only repeats the package and version (`@astrojs/node@11.1.7`) is left out.
- **Flag note.** `⚠` appears when any release of the package shown is breaking or security, even when the target is not, and the note under the headline names it as the Your stack tab does, for example `npm · major · breaking in 4.6.3 · 5 releases`. With automatic summaries off that note follows the headline on its line as far as the width allows.
- **Long headlines.** A long headline is cut at the right end of the line.

### Height

The band's height depends only on the width, the item count and whether automatic summaries are on, never on the page or on whether the selected item is saved. With automatic summaries off (the default) each item takes one line. With them on, each takes a second line for its summary (see [Summaries and languages](reference.md#summaries-and-languages)).

### Age column

Each row shows its item's age in a column of its own right after the source column, dim and right-aligned in 4 cells, so a headline sits next to its age, for example `› Agent SDK      10h  v0.3.294`. Ages read `now` under a minute, then `5m`, `2h`, `1d` to `6d`, `1w` to `4w`, `1mo` to `12mo` and `1y`, rounded down, from the item's own date and the clock. A release of your stack has its age in the same column after its package.

- A date a little ahead of the clock (up to a day, a feed's clock or zone running early) reads `now`.
- A date further ahead, an unparsable one and no date at all leave the column blank. Every row keeps the column, dated or not, so every headline and summary starts in the same cell.

The age is worked out when the band draws, so it refreshes whenever the band redraws (a new page or an arriving item, for example). While the rotation is paused and nothing redraws it can be stale, for example `5m` still showing after ten minutes. The band reads the clock for this (`$.clock.now`, the call the pane already makes for its `last update` time).

### Compact band

When the band's column is narrower than 65 cells, the full band's actions line at its widest, the band is compact. The compact band is one line with the name, the position as `13/156`, the page and auto buttons, then the item's headline cut to fit, for example `Herald 13/156  p: ◀  n: ▶  a: ⏸ auto  Claude Code v2.1.293 adds…`.

- It shows one item a page, so `p`, `n` and the rotation move one item at a time.
- It draws no summary, no selection buttons and no actions. The headline is still a link; for the other actions, open the pane with `/herald`.
- Where the headline's room holds the source column, its gap and 14 cells, a news item's source name, cut to 12 cells, comes before the headline, dim or in the release color as in the full band, and a bare version tag follows it bare. Narrower, the source is left out and a bare version tag leads with the name instead (`Claude Code v2.1.293`). Whether the source shows depends only on the width and the item count, so it mostly shows when the headline takes a row of its own.
- Where the headline would get fewer than 14 cells beside the controls it takes a row of its own, and where even the controls do not fit the name and position, the buttons and the headline take a row each. The compact band's height too depends only on the width and the item count.
- The compact band draws an item's age (as in the full band) after the source name, or after the glyph of a release of your stack, only where its room also holds the source column, its gap, the age column with its gap and the headline's 14 cells. That depends only on the width and the item count too: in practice when the headline takes a row of its own. An undated item shows no age there and its headline keeps the room.

For the cell counts behind these thresholds, see [Layout details](#layout-details).

### When the band is hidden

- **While the Herald pane is shown**, the band draws nothing of its own, since the pane lists the same items; whatever other mods draw in the band stays. The rotation keeps turning while the band is hidden but asks Haiku nothing for the pages it turns to. When you close the pane the band comes back and the page it shows gets its checks then, and its summaries while automatic summaries are on. A pane that waits for room (opened on a narrow terminal) does not hide the band.
- **While Claude Code shows a survey**, the band yields its place.
- **With no item** from any source or from your stack, the band draws nothing of its own, even when every source failed. The band has no state line.

## Keyboard focus

Hotkeys work while the band or the pane has keyboard focus; otherwise the keys go to the prompt.

- Press ctrl+x tab to give the keyboard to the Herald pane while it is open (the band is hidden then), or to the band otherwise.
- A click on the band or the pane gives it the keyboard too, and `/herald` opens the pane with it while the prompt is empty.
- While the band has focus, Tab moves between its controls, Enter presses the focused one and Esc returns focus to the prompt.
- While the pane does not have keyboard focus, its footer starts with `ctrl+x tab to use these keys:`. Once it has focus, the footer shows the keys alone.

## Pane

`/herald` opens the pane and asks for keyboard focus, which Claude Code grants while the prompt is empty. Esc closes the pane. Within a session the pane reopens on the tab it last showed; a new session, `/clear`, `/resume` and `/branch` start again on All.

### Tabs

The tab row at the top shows the All tab, a tab per enabled source, then Your stack and Saved. The tabs take one line when the pane is wide enough and wrap onto more lines otherwise.

- **Active tab.** The active tab is drawn as highlighted text, bold and underlined in the theme's inverse colors, and the other tabs are dim buttons with their hotkeys. Pressing the active tab's own key does nothing and keeps the pane focused, because that key stays bound to a button that draws nothing. Tab passes over it as one step with nothing highlighted, where the active tab sits in the row.
- **Labels.** A source's tab shows the band's short label while the source keeps its factory name (`Claude Code` for Claude Code releases, `Agent SDK` for Claude Agent SDK (TS)), else the name you gave it. `/herald list` and the rest of the text keep the full names. Labels are drawn whole, unless cutting the names longer than 16 cells (with `…`, wide characters counting two cells) puts the tabs on fewer lines. A name wider than the pane is always cut to fit one line.
- **Layout.** Which tab is active does not change the tab row's layout, except that on a narrow pane, entering a tab whose new count wrapped the tab row can take that line away again, and the window then shows one more row.

### Counts on tabs

A count is a token of its own after the tab's name, not part of it. The token is text beside the tab, not part of its button, so clicking it does nothing. No tab shows a count of zero.

- **A source's tab** shows how many of its items arrived since you last looked at that tab, as a bullet and the number in the accent color, for example `6: Hacker News •14`.
- **Your stack and Saved** show a total in dim parentheses, so a total never reads as new items: Your stack how many packages are behind, Saved how many items it holds, for example `y: Your stack (5)` and `0: Saved (2)`.
- **All** counts the new items among the rows it lists, by the same rule as a source tab, for example `l: All •31`.

Looking at a source's tab, by switching to it or by opening the pane on it with `/herald`, clears its count (and takes its items out of All's count), and so does leaving it. Looking at All clears the counts of the rows it draws instead: opening the pane on it, switching to it, or moving the selection so that the window shows other rows records the rows in the window as viewed, each under its own source. That source's count and All's count fall by them, while the rows outside the window keep counting. A source whose count has not started yet is left as it is. The first time `/herald` opens in a session the window is taken as 20 rows until the pane has drawn.

### Why All's count differs from a source tab's

All counts only the rows it lists. A release source lists only its newest release on All, so two new releases make `•2` on the source's tab and `•1` on All. For the same reason, viewing All clears just that newest release: the source's tab keeps counting its older new releases while All shows none. Your stack's releases have no new count, so they never count on All and are never recorded as viewed.

### Rows and the window

The title line under the tabs holds the `k: ↑` and `j: ↓` buttons and, at its right end, the window's position in the tab, for example `1–14 of 14`. It does not repeat the tab's name.

The pane shows a window of the active tab's items around the selection, one line each with its headline link and, at the right end, its date.

- **Date column.** The column is 7 cells wide (a space and 6 cells), right-aligned, on every tab including Your stack, so the dates end at the pane's edge. An item less than a day old shows its age as the band does (`now`, `5m`, `2h`, `23h`), an older one its date in UTC (`Oct 7`, `Sep 28`), and an undated one leaves the column blank. The age is worked out when the pane draws, from the clock, so it refreshes whenever the pane redraws.
- **Selection.** The selected item is highlighted across the whole row, headline, source name and date, in the theme's inverse colors, and keeps its `›`.
- **Read items.** The other rows stay plain, except that a news item you have read, opened with `o` or copied with `c`, has its headline drawn dim, on All, on its source's tab and on Saved.
- **Summaries.** While automatic summaries are on, only the selected item shows its summary, on up to three lines under its headline (none for an item without text). While they are off, no item shows one. The window keeps the same size either way.
- **Source marks.** A source's own tab shows no source mark, since every row is from it. The Saved tab shows each item's source name in dim text just before the date column, the names ending in one column; a long headline drops the name before it is cut.
- **Your stack.** The Your stack tab shows one row per package instead, grouped by ecosystem, with a summary line and a filter field above them. The field is left out while the tab has no release to filter and no filter in force. For its columns, see [What you see](your-stack.md#what-you-see).

### All tab

The pane opens on the All tab, first in the tab row, on `l` (the band's `a` is taken by auto, and `l` is a key no band or pane button uses). All lists what the band pages through, in the band's order and built by the same code: the newest two packages of your stack with a breaking or security release first, then every enabled source's items mixed by source, your stack counted as one source, one row per package, a release source by its newest release only, and items without a date last. Unlike the band it keeps the items you have read, in their place, their headlines drawn dim.

Each row starts with the band's source column, 12 cells wide: a news item's source as its short label, dim, or in the theme's Claude color for a release; a package of your stack its `📦` or `⚠` and its name, with `current → target` as its headline and the target's date. Then come the headline and, at the right end, the date (or the age of an item less than a day old), for example `› Hacker News   Margaret Hamilton has died   Oct 7` or `› Hacker News   Margaret Hamilton has died   2h`.

`o`, `s`, `v` and `c` act on the item under the selected row, a release of your stack as they do in the band. All has no filter, like the source tabs, and no `e`.

### State lines

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
| Your stack, lookups under way | `Checking your stack's releases: 4 of 12 packages so far…`. Lookups and feed reads are spread over refreshes; see [Limits per refresh](your-stack.md#limits-per-refresh). |
| Your stack, no feed for any package | `No release feed found for any of your 3 packages. /herald deps map <package> <owner/repo> sets one.` |
| Your stack, releases below the level | `No release at the minor+ level. /herald deps level all shows every release.` |
| Your stack, nothing new | `Everything in your stack is up to date.`, or, when some packages have no feed, `Everything in your stack is up to date · 2 without a release feed, listed by /herald deps.` |

### Footer and keys

The footer at the pane's bottom holds the keys that act on the active tab: `o`, `s`, `v` and `c` on All and on a source's tab; `o`, `s`, `c` and `r` on Saved, whose items are saved already; and `o`, `s`, `v`, `c` and `e` on Your stack. An empty tab has no footer. For how the footer changes with focus, see [Keyboard focus](#keyboard-focus).

A docked pane keeps the footer on its last row however few items the tab has, and the window of items is the same size with or without focus. Tab walks the pane's controls in the order drawn: the tabs, All first, `k` and `j`, the filter field on Your stack, then the footer.

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

## Item actions

The same four actions apply to the selected item in the band and in the pane, on All a row's own item, a package of your stack acting on its target release, except that the pane's Saved tab has no Save, since its items are saved already. On the Your stack tab, a package's row acts on its highest release shown, and a release listed under an expanded package acts on that release.

| Key | Button | What it does |
|-----|--------|--------------|
| `o` | Open | Opens the item's address in your default browser and counts the item as read. The headline is also a link, but a click on it is not counted, since Claude Code does not tell the mod. Addresses that are not http or https are refused. |
| `s` | Summarize | Writes a 3 to 5 line summary under the item's title in the transcript, without starting a turn, whether automatic summaries are on or off. Claude does not read these lines. For a release, the summary comes from its notes. An item without text gets a line that says so instead, with no model call. |
| `v` | Save / Saved | Adds the item to the Saved tab. The button reads Saved for an item already saved, and pressing it changes nothing. |
| `c` | Copy for Claude | Copies the [copy template](reference.md#copy-template) filled with the item to the clipboard and shows a "📋 Copied" toast. It never submits a prompt, and it counts the item as read once the text reached a clipboard. The text comes from the feed, so pasting it into the prompt makes it part of your prompt. |

## Layout details

These cell counts set where the band turns compact and how the tabs wrap:

| Measure | Cells |
|---------|-------|
| Full band's actions line at its widest, with `Saved` | 65. Narrower, the band is compact. |
| Full band's header | 42 for under ten items, 48 for a hundred or more. |
| Where a headline starts in the full band | 22 cells from the left edge: the mark, the 12-cell source column, the age column and their gaps. |
| Compact band, room for the source before the headline | 28: the source column, its gap and 14 cells. |
| Compact band, room for the age as well | 34: the source column, its gap, the age column with its gap and the headline's 14 cells. |
| Compact band, controls on one row | 38 for 100 to 999 items. Narrower, the name and position, the buttons and the headline take a row each. |
| Default tabs on one line, All included, no counts | 154 on the terminal, so they take two lines at 100. |
| Default tabs on one line with typical counts | 182, with five sources with new items, All with the new items it lists, and Your stack and Saved with totals. |
