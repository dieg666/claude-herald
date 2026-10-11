#!/usr/bin/env bash
# Runs the checks a change must pass: manifest/module validation, the type check and the tests.
set -euo pipefail
cd "$(dirname "$0")/.."

types=.claude-plugin/types

types_written() {
  [ -f "$types/claude-code/index.d.ts" ] && [ -f "$types/claude-code-tools/index.d.ts" ] && [ -f "$types/claude-code-mcp/index.d.ts" ]
}

# Print a process and all its descendants, deepest first.
process_tree() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null || true); do
    process_tree "$child"
  done
  echo "$1"
}

# Stop a process tree: ask politely, then force what is left.
stop_tree() {
  local pids pid
  pids=$(process_tree "$1")
  for pid in $pids; do kill "$pid" 2>/dev/null || true; done
  sleep 1
  for pid in $pids; do kill -9 "$pid" 2>/dev/null || true; done
}

# Run `claude --plugin-dir .` on a pty and wait for the types.
# Claude Code writes them only when a trusted directory loads the mod in an interactive session, and that needs no sign-in.
write_types() {
  local session
  export TERM=xterm-256color
  if script --version 2>&1 | grep -q util-linux; then
    script -qefc 'claude --plugin-dir .' /dev/null </dev/null >/dev/null 2>&1 &
  else
    script -q /dev/null claude --plugin-dir . </dev/null >/dev/null 2>&1 &
  fi
  session=$!
  for _ in $(seq 1 120); do
    types_written && break
    kill -0 "$session" 2>/dev/null || break
    sleep 1
  done
  sleep 1
  stop_tree "$session"
  wait "$session" 2>/dev/null || true
  if [ ! -f "$types/claude-code/index.d.ts" ]; then
    echo "Claude Code did not write the types. Open \`claude --plugin-dir .\` once in this directory and accept the trust prompt, then rerun." >&2
    exit 1
  fi
}

[ -f "$types/claude-code/index.d.ts" ] || write_types

claude plugin validate .
bunx prettier@3 --check --no-error-on-unmatched-pattern hooks tests types
bunx -p typescript@5 tsc -p .
if [ -n "$(find . -path ./node_modules -prune -o -name '*.test.ts*' -print -quit)" ]; then
  claude plugin test .
fi
