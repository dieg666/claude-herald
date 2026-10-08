#!/usr/bin/env bash
# Records the README media in docs/media from a live Claude Code session running this checkout's mod.
# Usage: scripts/record-media.sh <step>; docs/media/README.md lists the steps and their order.
set -euo pipefail

ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
OUT="$ROOT/docs/media"
WORK=${HERALD_MEDIA_WORK:-/tmp/herald-media}
PROJ=${HERALD_MEDIA_PROJECT:-/tmp/acme-web}
CLASS=herald-rec
COLS=${COLS:-100}
# 56 rows: outside fullscreen the pane sits above the prompt in at most half the rows; the media keep only the rows in use.
ROWS=${ROWS:-56}
FONT=${FONT:-12.0}
SCHEME=${SCHEME:-Catppuccin Mocha}
FPS=${FPS:-12}
WIDTH=${WIDTH:-1000}
PANE=0
export DISPLAY=${DISPLAY:-:0}
RUNTIME=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}
mkdir -p "$WORK" "$OUT"

gui_pid() { pgrep -f "^wezterm-gui .*--class $CLASS" | head -1; }

cli() {
  local pid
  pid=$(gui_pid)
  [ -n "$pid" ] || { echo "no $CLASS window; run: $0 launch" >&2; exit 1; }
  WEZTERM_UNIX_SOCKET="$RUNTIME/wezterm/gui-sock-$pid" wezterm cli "$@"
}

window_id() { xdotool search --onlyvisible --class "$CLASS" | head -1; }

# The Claude Code pane's size as "cols rows cell_w cell_h".
pane_geometry() {
  cli list --format json | jq -r --argjson p "$PANE" '.[] | select(.pane_id == $p) | .size |
    "\(.cols) \(.rows) \(.pixel_width / .cols | floor) \(.pixel_height / .rows | floor)"'
}

screen_text() { cli get-text --pane-id "$PANE"; }

# True when the screen has a line matching $1; grep reads it all, since wezterm cli panics on a closed pipe.
on_screen() { screen_text | grep -E "$1" >/dev/null; }

send() { cli send-text --no-paste --pane-id "$PANE" "$1"; }

# Fails unless the prompt is empty (its placeholder suggestion aside), so no stray text gets submitted.
require_empty_prompt() {
  local rest
  rest=$(screen_text | grep '^❯' | tail -1 | sed 's/^❯//' | tr -d ' \302\240')
  if [ -n "$rest" ] && [[ $rest != Try\"* ]]; then
    echo "the prompt is not empty; clear it with ctrl+u first" >&2
    exit 1
  fi
}

# Types a /herald command and presses Enter, but only into an empty prompt.
slash() {
  case "$1" in /herald*) ;; *) echo "only /herald commands are typed" >&2; exit 1 ;; esac
  require_empty_prompt
  send "$1"
  sleep 0.6
  send $'\r'
}

# Moves keyboard focus between the prompt and the band or pane, as two separate keys.
toggle_focus() {
  send $'\x18'
  sleep 0.3
  send $'\t'
  sleep 0.4
}

# Records the Claude Code pane losslessly into $1 for at most $2 seconds, in the background.
record() {
  local cols rows cw ch wid
  read -r cols rows cw ch < <(pane_geometry)
  wid=$(window_id)
  [ -n "$wid" ] || { echo "the $CLASS window is not visible" >&2; exit 1; }
  ffmpeg -loglevel error -y -f x11grab -draw_mouse 0 -framerate 30 -window_id "$wid" -i "$DISPLAY" \
    -t "$2" -vf "crop=$((cols * cw)):$((rows * ch)):0:0" -c:v libx264rgb -qp 0 -preset ultrafast "$1" &
  REC_PID=$!
  sleep 0.5
}

# Converts a recording to a GIF: input, output, first second, length, rows kept from the top, gifsicle lossiness.
to_gif() {
  local cols rows cw ch
  read -r cols rows cw ch < <(pane_geometry)
  rm -rf "$WORK/frames"
  mkdir -p "$WORK/frames"
  ffmpeg -loglevel error -ss "$3" -t "$4" -i "$1" -vf "fps=$FPS,crop=iw:$(($5 * ch)):0:0" "$WORK/frames/%04d.png"
  gifski --quiet --fps "$FPS" --width "$WIDTH" --quality 90 -o "$WORK/gifski.gif" "$WORK"/frames/*.png
  gifsicle -O3 --lossy="$6" "$WORK/gifski.gif" -o "$2"
  echo "$2 $(du -h "$2" | cut -f1) $(magick identify -format '%wx%h' "$2[0]")"
}

# Saves a still of the Claude Code pane, its first $2 rows (all of them by default).
still() {
  local cols rows cw ch
  read -r cols rows cw ch < <(pane_geometry)
  # One x11grab frame rather than maim, whose window shot includes the window manager's border.
  ffmpeg -loglevel error -y -f x11grab -draw_mouse 0 -window_id "$(window_id)" -i "$DISPLAY" -frames:v 1 \
    -vf "crop=$((cols * cw)):$((${2:-$rows} * ch)):0:0" "$1"
  echo "$1 $(du -h "$1" | cut -f1) $(magick identify -format '%wx%h' "$1")"
}

# The number of rows from the top through the last non-blank line, plus one.
used_rows() { screen_text | awk 'NF { last = NR } END { print last + 1 }'; }

# The band's position, such as "1–3 of 25".
band_position() { screen_text | grep -oE '^Herald +[0-9]+–[0-9]+ of [0-9]+' | sed -n 1p; }

case "${1:-}" in
  project)
    # A neutral demo project: a few popular packages pinned at older versions, so Your stack has releases to show.
    mkdir -p "$PROJ"
    cat >"$PROJ/package.json" <<'EOF'
{
  "name": "acme-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "astro": "5.16.4",
    "jsdom": "25.0.1",
    "next": "14.2.15",
    "react": "18.3.1",
    "zod": "3.23.8"
  }
}
EOF
    [ -d "$PROJ/.git" ] || git -C "$PROJ" init -q
    echo "$PROJ"
    ;;

  launch)
    # A vanilla session: no inherited session variables, no user settings, only this checkout's mod.
    [ -f "$PROJ/package.json" ] || "$0" project
    [ -z "$(gui_pid)" ] || { echo "a $CLASS window is already open" >&2; exit 1; }
    for v in $(env | grep -oE '^(CLAUDE[A-Z0-9_]*|CLAUDECODE)='); do unset "${v%=}"; done
    if [ "${SOFTWARE_GL:-0}" = 1 ]; then
      # Mesa's software renderer, for when the GPU driver cannot create a window.
      export __EGL_VENDOR_LIBRARY_FILENAMES=/usr/share/glvnd/egl_vendor.d/50_mesa.json
      export __GLX_VENDOR_LIBRARY_NAME=mesa LIBGL_ALWAYS_SOFTWARE=1
    fi
    setsid -f wezterm-gui --skip-config \
      --config "color_scheme='$SCHEME'" --config "font_size=$FONT" --config 'enable_tab_bar=false' \
      --config 'window_padding={left=0,right=0,top=0,bottom=0}' \
      --config 'inactive_pane_hsb={saturation=1.0,brightness=1.0}' \
      --config "window_close_confirmation='NeverPrompt'" --config "audible_bell='Disabled'" \
      start --always-new-process --class "$CLASS" --cwd "$PROJ" -- \
      claude --plugin-dir "$ROOT" --setting-sources project,local --permission-mode default \
      >"$WORK/gui.log" 2>&1
    for _ in $(seq 50); do [ -n "$(gui_pid)" ] && [ -n "$(window_id)" ] && break; sleep 0.2; done
    sleep 2
    # A tiling window manager sizes the window, so split off the excess to leave Claude Code at COLS x ROWS.
    read -r cols rows _ _ < <(pane_geometry)
    if [ "$cols" -lt "$COLS" ] || [ "$rows" -lt "$ROWS" ]; then
      echo "the window holds ${cols}x${rows} cells, less than ${COLS}x${ROWS}; lower FONT" >&2
      exit 1
    fi
    [ "$cols" -le "$COLS" ] || cli split-pane --pane-id "$PANE" --right --cells $((cols - COLS - 1)) -- sleep infinity >/dev/null
    [ "$rows" -le "$ROWS" ] || cli split-pane --pane-id "$PANE" --bottom --cells $((rows - ROWS - 1)) -- sleep infinity >/dev/null
    cli activate-pane --pane-id "$PANE"
    read -r cols rows cw ch < <(pane_geometry)
    echo "Claude Code pane: ${cols}x${rows} cells of ${cw}x${ch} px. Accept the folder trust prompt if it shows."
    ;;

  trust)
    # Accepts the workspace trust prompt for the demo project, only when that prompt is on screen.
    on_screen 'trust this folder' || { echo "no trust prompt on screen"; exit 0; }
    on_screen '❯ Yes, I trust this folder' || send $'\e[B'
    sleep 0.5
    on_screen '❯ Yes, I trust this folder' || { echo "could not select Yes" >&2; exit 1; }
    send $'\r'
    ;;

  setup)
    # AINews posts a daily "not much happened today" issue that adds nothing to a demo; restore re-enables it.
    slash '/herald disable AINews (smol.ai)'
    ;;

  restore)
    slash '/herald enable AINews (smol.ai)'
    ;;

  hero)
    # The band from its first page: an automatic page turn, then a manual one with n.
    [ -n "$(band_position)" ] || { echo "no band on screen" >&2; exit 1; }
    rows_kept=$(($(screen_text | grep -n 'manual mode on' | tail -1 | cut -d: -f1) + 1))
    # The band before it takes the keyboard (no focus ring), for the social preview.
    still "$WORK/band.png" "$rows_kept" >/dev/null
    toggle_focus
    if [[ $(band_position) != Herald\ *1–* ]]; then
      # Back to the first page with p, which pauses the rotation.
      for _ in $(seq 60); do [[ $(band_position) == Herald\ *1–* ]] && break; send p; sleep 0.4; done
    fi
    # a resumes a paused rotation.
    if on_screen '^Herald .*a: ▶ auto'; then send a; sleep 0.4; fi
    pos=$(band_position)
    record "$WORK/hero.mkv" 40
    started=$(date +%s.%N)
    for _ in $(seq 300); do [ "$(band_position)" = "$pos" ] || break; sleep 0.1; done
    [ "$(band_position)" != "$pos" ] || { send $'\e'; echo "the band did not turn within 30 s" >&2; exit 1; }
    turned=$(date +%s.%N)
    sleep 3
    send n
    sleep 2.5
    kill -INT "$REC_PID"
    wait "$REC_PID" || true
    # Esc gives the keyboard back to the prompt.
    send $'\e'
    from=$(awk -v s="$started" -v t="$turned" 'BEGIN { d = t - s - 2.5; print (d > 0 ? d : 0) }')
    to_gif "$WORK/hero.mkv" "$OUT/hero.gif" "$from" 8 "$rows_kept" "${LOSSY:-20}"
    ;;

  pane)
    # The pane: open it on All, move the selection, visit a source tab and Your stack, come back to All.
    require_empty_prompt
    record "$WORK/pane.mkv" 18
    tallest=0
    keep() { local r; r=$(used_rows); [ "$r" -le "$tallest" ] || tallest=$r; }
    press() { send "$1"; sleep "$2"; keep; }
    sleep 0.5
    send '/herald'
    sleep 0.9
    press $'\r' 2.2
    tab=$(screen_text | grep -oE '[1-9]: Hacker News' | head -1 | cut -c1)
    for k in j j j k; do press "$k" 0.6; done
    sleep 0.6
    press "${tab:-1}" 1.6
    for k in j j; do press "$k" 0.6; done
    sleep 0.6
    press y 2.2
    press j 1.2
    press l 1.6
    kill -INT "$REC_PID"
    wait "$REC_PID" || true
    to_gif "$WORK/pane.mkv" "$OUT/pane.gif" 0.3 15.5 "$tallest" "${LOSSY:-30}"
    ;;

  stack)
    # The Your stack tab, cropped to the pane's frame.
    on_screen '^╭' || { slash '/herald'; sleep 2; }
    if on_screen 'ctrl\+x tab to use these keys'; then toggle_focus; fi
    # The active tab is not a button, so its key would fall through to the prompt.
    on_screen 'packages? behind' || send y
    sleep 2
    # A key that reached the prompt instead is cleared with ctrl+u, never submitted.
    if ! (require_empty_prompt 2>/dev/null); then send $'\x15'; echo "y reached the prompt; cleared it, run again" >&2; exit 1; fi
    top=$(screen_text | grep -n '^╭' | head -1 | cut -d: -f1)
    bottom=$(screen_text | grep -n '^╰' | head -1 | cut -d: -f1)
    still "$WORK/stack-full.png" "$bottom"
    read -r _ _ _ ch < <(pane_geometry)
    magick "$WORK/stack-full.png" -crop "x$(((bottom - top + 1) * ch))+0+$(((top - 1) * ch))" +repage "$OUT/stack.png"
    echo "$OUT/stack.png $(du -h "$OUT/stack.png" | cut -f1) $(magick identify -format '%wx%h' "$OUT/stack.png")"
    ;;

  social)
    # The 1280x640 social preview: name, pitch and the band still the hero step took.
    [ -f "$WORK/band.png" ] || { echo "no band still; run: $0 hero" >&2; exit 1; }
    bold=$(fc-match -f '%{file}' 'JetBrains Mono:style=ExtraBold')
    regular=$(fc-match -f '%{file}' 'JetBrains Mono:style=Regular')
    magick "$WORK/band.png" -bordercolor '#1e1e2e' -border 16 -bordercolor '#45475a' -border 2 "$WORK/band-framed.png"
    magick -size 1280x640 xc:'#1e1e2e' -gravity northwest \
      -font "$bold" -pointsize 84 -fill '#fab387' -annotate +68+36 'Herald' \
      -font "$regular" -pointsize 30 -fill '#cdd6f4' -annotate +72+156 'News and releases for your stack, right above the prompt.' \
      "$WORK/band-framed.png" -gravity south -geometry +0+36 -composite \
      "$OUT/social-preview.png"
    echo "$OUT/social-preview.png $(du -h "$OUT/social-preview.png" | cut -f1) $(magick identify -format '%wx%h' "$OUT/social-preview.png")"
    ;;

  cmd)
    # Runs one /herald command in the session, for checks such as /herald deps.
    slash "$2"
    ;;

  text)
    screen_text
    ;;

  stop)
    pid=$(gui_pid)
    [ -z "$pid" ] || kill "$pid"
    ;;

  *)
    echo "usage: $0 project|launch|trust|setup|hero|pane|stack|social|restore|cmd <command>|text|stop" >&2
    exit 2
    ;;
esac
