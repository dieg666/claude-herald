# Development

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

Installed copies update only when `version` in `.claude-plugin/plugin.json` changes, because the manifest pins it. A new `calls:` entry in the output of `claude plugin validate .` needs a matching row in the [calls table](security.md#calls). `CLAUDE.md` describes the layout of `hooks/`, the rules the engine's static analysis enforces and the test conventions.
