# How-to guides

These guides cover installing, updating and removing Herald, cutting its model calls and fixing common problems. For what each command and setting does, see the [Reference](reference.md).

## Install from the marketplace

You need Claude Code 2.1.287 or later. To check whether Herald is installed already, run `claude plugin list` in your shell: it shows `herald@claude-herald` as enabled.

1. Add the marketplace and install the plugin from your shell:

   ```bash
   claude plugin marketplace add dieg666/claude-herald
   claude plugin install herald@claude-herald
   ```

   Inside a Claude Code session, this command does the same:

   ```text
   /plugin install herald --marketplace dieg666/claude-herald
   ```

2. If you installed from your shell while a session is open, run `/reload-plugins` in that session.
3. To check that the mod is loaded, run `/herald`, or run `claude plugin list` in your shell.

## Try Herald for one session

To try the mod without installing it, clone the repository and start Claude Code with the plugin directory:

```bash
git clone https://github.com/dieg666/claude-herald.git
claude --plugin-dir ./claude-herald
```

## Update

To update an installed copy, run these in your shell and restart Claude Code:

```bash
claude plugin marketplace update claude-herald
claude plugin update herald@claude-herald
```

For a clone started with `--plugin-dir`, pull the repository instead.

## Uninstall

To uninstall, run `claude plugin uninstall herald@claude-herald`, or use the **Installed** tab of `/plugin`. `claude plugin marketplace remove claude-herald` removes the marketplace. To check that it is gone, run `claude plugin list`.

Claude Code does not document whether an uninstall deletes the mod's data. To delete it, see [Delete stored data](#delete-stored-data).

## Delete stored data

Herald keeps its data in one store file. For what the store holds, see [Stored data](reference.md#stored-data).

1. Quit Claude Code.
2. Delete `~/.claude/plugins/store/herald_<source>-<id>.json` (`herald_inline-…json` for a `--plugin-dir` load). This path was observed on Claude Code 2.1.293 and is not documented by Claude Code.

To check, list `~/.claude/plugins/store/`: no `herald_` file remains.

## Reduce Haiku calls

Each model call counts against your plan or is billed to your API key. For when the mod calls Haiku, see [Haiku calls and cost](reference.md#haiku-calls-and-cost). To make fewer calls, do any of these:

- Leave automatic summaries off (the default), or run `/herald summaries off`. `/herald summaries` says which is in force.
- Pause the rotation with `a`, or run `/herald rotate 3600`. Each band page the rotation reaches gets its checks, and its summaries while they are on, except while the Herald pane is shown.
- Run `/herald deps off` to stop all stack requests and calls for the project.
- Lower `/herald deps cap`, `ignore` packages, or raise `/herald deps level` to check fewer releases.

`/herald deps toast off` cuts nothing, because the check on new releases runs whatever the toast level.

## Fix common problems

| Symptom | Check |
|---------|-------|
| The band does not appear. | It is drawn once an enabled source has items, so wait for the first refresh. `/herald list` shows each source's item count and last error. It is also hidden at times; see [When the band is hidden](band-and-pane.md#when-the-band-is-hidden). |
| `/herald` does nothing visible. | Run `/plugin` and look for `herald` on the `mods active` line. If it is missing, run `/reload-plugins`. |
| A source shows an error in `/herald list`, or `Couldn't refresh` in the pane. | It failed its last fetch, and the mod keeps its older items and tries again at the next refresh. If it keeps failing, see [Fix a source that keeps failing](#fix-a-source-that-keeps-failing). |
| A release does not show. | It is at or below your version; it is a patch release and the show level is `minor+`; it is a pre-release and the show level is not `all`; its package waits for a lookup (10 per refresh), is paused for an hour after a failure, or is `unresolved` in `/herald deps`; or the stack is off for this project. |
| A package is `unresolved`. | Its registry names no GitHub repository, GitHub does not have it, or its name is not valid for that registry. Run `/herald deps map <package> <owner/repo\|feed-url>`. |
| A hotkey types the letter into the prompt. | The band or the pane does not have keyboard focus; the pane's footer then starts with `ctrl+x tab to use these keys:`. Press ctrl+x tab (it focuses the open pane, or the band when no pane is open), click the pane, or open it with `/herald` from an empty prompt. See [Keyboard focus](band-and-pane.md#keyboard-focus). |
| No summary shows under the headlines. | Automatic summaries are off by default. Run `/herald summaries on`, or press `s` on an item for a summary of it alone. |
| A summary shows `…` for a long time. | It waits for a model call. A failed call is retried the next time the item is shown. |

## Fix a source that keeps failing

A source that fails keeps its last items and is tried again at every refresh. To find out why it fails and fix it:

1. Run `/herald list` and read the source's last error, such as `HTTP 503`. The source's pane tab shows the same reason, with the time of the last refresh that worked.
2. To retry at once, run `/herald disable <name>` and then `/herald enable <name>`. Enabling a source refreshes it at once; enabling a source that is on already does nothing. If the error is gone from `/herald list`, you are done.
3. Check the common causes in [Limitations](reference.md#limitations): a feed that needs a specific User-Agent, a web-fetch policy of your organization, or a request that hangs for 90 seconds.
4. If the source still fails, remove it with `/herald remove <name>`, and follow it again at a working address with `/herald add <url> [name]`. To check, run `/herald list`: the old source is gone.
