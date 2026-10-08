# Design decisions and deviations

This page explains why Herald behaves as it does where the reason is not plain from the [Reference](reference.md) or [Band and pane](band-and-pane.md). It also records the deviations from the plan, where Claude Code's mods API or its types required a different design from the one first intended. Each row names a behaviour and the reason for it.

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
