# README media

Screenshots and recordings of the mod running in a real Claude Code session, for the repository's README and its social preview.

| File | What it shows | Size |
|------|---------------|------|
| `hero.gif` | The band on its first page, an automatic page turn, then a manual one with `n` (8 s). | 1000x330 |
| `pane.gif` | `/herald` opening the pane on All, the selection moving, the Hacker News tab, Your stack, and back to All (15 s). | 1000x616 |
| `stack.png` | The pane's Your stack tab, with breaking releases marked `⚠`. | 1000x308 |
| `social-preview.png` | The name, the one-line pitch and the band, for the repository's social preview. GitHub does not read it from the repository: upload it under Settings, General, Social preview. | 1280x640 |

## How they are made

`scripts/record-media.sh` drives a dedicated WezTerm window running `claude --plugin-dir <this checkout>` in a demo project, records it with ffmpeg's `x11grab`, and converts the recordings with gifski and gifsicle. It needs X11, WezTerm, ffmpeg, gifski, gifsicle, xdotool, ImageMagick, jq and the JetBrains Mono font. The session is vanilla: the script unsets every inherited `CLAUDE*` variable, starts Claude Code with `--setting-sources project,local --permission-mode default` (no user settings, no other plugins) and WezTerm with `--skip-config` (Catppuccin Mocha, JetBrains Mono at 12 pt).

Run the steps in this order from the repository root:

```bash
scripts/record-media.sh project   # writes /tmp/acme-web: a package.json pinning astro, jsdom, next, react and zod at older versions, git init
scripts/record-media.sh launch    # opens the window; the Claude Code pane is split down to 100x56 cells
scripts/record-media.sh trust     # accepts the workspace trust prompt for /tmp/acme-web, if it shows
scripts/record-media.sh setup     # /herald disable AINews (smol.ai): its daily "not much happened today" issues add nothing to a demo
scripts/record-media.sh cmd '/herald deps'   # check that the stack's packages resolved; their releases arrive within a refresh or two
scripts/record-media.sh stop && scripts/record-media.sh launch   # a fresh session: the band starts on its first page, the pane opens on All
scripts/record-media.sh hero      # docs/media/hero.gif, plus the band still the social preview uses
scripts/record-media.sh pane      # docs/media/pane.gif
scripts/record-media.sh stack     # docs/media/stack.png
scripts/record-media.sh social    # docs/media/social-preview.png
scripts/record-media.sh restore   # /herald enable AINews (smol.ai)
scripts/record-media.sh stop
```

`text` prints the session's screen, which is the way to check what a step left behind. Settings are environment variables: `COLS`, `ROWS` and `FONT` (the terminal), `SCHEME` (a WezTerm color scheme), `FPS`, `WIDTH` and `LOSSY` (the GIFs), `HERALD_MEDIA_PROJECT` and `HERALD_MEDIA_WORK` (the demo project and the scratch folder, `/tmp/acme-web` and `/tmp/herald-media`). `SOFTWARE_GL=1` starts WezTerm on Mesa's software renderer, for when the GPU driver cannot create a window (WezTerm logs `egl Initialize: BAD_ACCESS`).

## Things to know

- The script types nothing into the prompt but `/herald` commands, each into an empty prompt; any other key goes to the band or the pane after `ctrl+x` then `tab`, sent apart. A stray key in the prompt can start a model turn, so a key that lands there is cleared with ctrl+u, never submitted. The active pane tab is not a button, so its own key falls through to the prompt: the `stack` step presses `y` only when Your stack is not showing.
- The terminal is 100 columns by 56 rows, and the media keep only the rows in use. Outside fullscreen the pane sits above the prompt in at most half the terminal's rows, so at 30 rows it lists a single item and at 56 it lists eight.
- `x11grab` reads the screen, so the window must stay visible while a step records. With a tiling window manager the window takes its tile; the script splits off the extra columns and rows into blank panes and crops them away.
- The demo shows real public news and the real releases of the demo project's packages, so the items differ from one recording to the next. Check every frame for anything personal before committing: the header shows only `/tmp/acme-web`.
- The `--plugin-dir` session uses the store of every `--plugin-dir` session on the machine, so `setup` disables AINews there too, and `restore` turns it back on.
- There is no Saved shot: the Saved tab was empty when these were recorded, and the media show only real items.
