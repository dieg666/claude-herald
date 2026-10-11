# Development

You need Claude Code 2.1.287 or later and [Bun](https://bun.sh). To run every check, run:

```bash
scripts/check.sh
```

The script runs these steps and stops at the first failure:

1. `claude plugin validate .`, which must pass with no warning.
2. `bunx prettier@3 --check` on `hooks`, `tests` and `types`.
3. `bunx -p typescript@5 tsc -p .`.
4. `claude plugin test .`, which runs the tests with a mocked clock, store, network and model.

The Claude Code types for your build live in `.claude-plugin/types` and are not committed. Claude Code writes them only when a trusted directory loads the mod in an interactive session, so on its first run, when the types are missing, the script opens `claude --plugin-dir .` on a pseudo-terminal, waits for the files and stops that session. This needs no sign-in and never edits `~/.claude.json`. If the directory is not trusted yet, the script stops with a message: open `claude --plugin-dir .` once in this directory, accept the trust prompt and rerun. The session loads the mod for a moment, so it uses your real `$.store`, like any other session.

The CI workflow writes a `~/.claude.json` that marks the workspace as trusted before it runs the script. Every CI run, the maintainer's included, waits in the `ci` environment until a maintainer approves it under the run's *Review deployments*.

Installed copies update only when `version` in `.claude-plugin/plugin.json` changes, because the manifest pins it. A new `calls:` entry in the output of `claude plugin validate .` needs a matching row in the [calls table](security.md#calls). `.claude/CLAUDE.md` describes the layout of `hooks/`, the rules the engine's static analysis enforces and the test conventions.
