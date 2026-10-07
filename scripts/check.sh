#!/usr/bin/env bash
# Runs the checks a change must pass: manifest/module validation, the type check and the tests.
set -euo pipefail
cd "$(dirname "$0")/.."

# Lay this build's types under .claude-plugin/types (a local command, no model call).
if [ ! -f .claude-plugin/types/claude-code/index.d.ts ]; then
  claude -p "/cost" --plugin-dir . >/dev/null
fi

claude plugin validate .
bunx -p typescript@5 tsc -p .
claude plugin test .
