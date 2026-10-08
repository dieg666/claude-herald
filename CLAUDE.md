# Herald mod: working rules

A Claude Code mod (a plugin with a hooks module) that shows news from RSS/Atom feeds and web pages: a rotating band above the prompt, a `/herald` pane, saved items and copy-for-Claude. Needs Claude Code 2.1.287 or later. The plugin's name is `herald` and the marketplace's `claude-herald` (a plugin name starting with `claude-` is refused by `claude plugin validate`).

## Sources of truth

- The types for the installed build: `.claude-plugin/types/claude-code/index.d.ts` (written by `scripts/check.sh` on first run, gitignored). Grep it for the event or method at hand (`'command.run'`, `AbovePrompt: {`, `export type ModelCompleteRequest`) and read the declaration. Never guess an API; when the docs or types disagree with a bead, the types win and the deviation goes in the README.
- Docs: https://code.claude.com/docs/en/plugins/mods/overview.md and its siblings (`create`, `interface`, `events`, `api`, `reference`, `test`, `troubleshoot`).
- Structure and test style mirror Anthropic's built-in mods (https://github.com/anthropics/claude-code/tree/main/mods, `diff` in particular).

## Checks

`scripts/check.sh` runs `claude plugin validate .`, `bunx prettier@3 --check` (settings in `.prettierrc.json`), `bunx -p typescript@5 tsc -p .` and `claude plugin test .`. All of them must pass before a change is done. `claude plugin validate` must stay clean: no new `calls:` entry without a matching line in the README's permissions table.

## Layout

```
.claude-plugin/plugin.json   manifest ("types": "./types/index.d.ts")
hooks/hooks.json             names the module
hooks/register.tsx           wiring only: every on(...) call, the Host binding, the render hooks
hooks/<concern>/             one folder per concern: one exported function or constant per file,
                             an index.ts barrel (export * from './x'; export * as default from '.')
types/index.d.ts             the $.state contract and the shared domain types (Source, Item, Settings, ...)
tests/<concern>/*.test.ts    mirrors hooks/; shared fixtures in tests/fixtures/, one export per file
```

Concern folders: `names` (plugin, command, pane ids, store keys, hotkeys), `defaults` (factory sources and settings), `host` (the Host type), `feed` (RSS/Atom parser, pure), `page` (HTML to text, content hash, extraction prompt and validation), `items` (ids, dedupe, merge, caps), `store` (persisted data over the Host), `state` (initial state, hydrate), `refresh` (the fetch loop, new-item toasts), `summaries` (Haiku summaries, cache, language, concurrency), `actions` (open, summarize, save, mark read, copy), `band` (AbovePrompt view, rotation), `pane` (Pane view), `commands` (`/herald` parsing and handlers, `/herald deps` and its subcommands), `deps/detect` (the project's stack from its manifests and lockfiles: the walk, workspace members, one detector per ecosystem, pure parsers, the followed packages with ignored ones left out and hand-added ones in), `deps/resolve` (each package's GitHub repository from its registry, its release feed, overrides, the list of contacted hosts), `deps/classify` (versions of every scheme parsed and compared, the version a release tag or title names, releases classified against the version in use, breaking and security flags by keyword and by Haiku), `deps/stack` (the stack's releases followed on the refresh timer: lookups and feeds a few per run, failures left alone for an hour, show and toast levels, the band and pane lines, the toasts; rescanned on request, each run ends with the settings saved meanwhile).

## Rules the engine's static analysis enforces

- Write every mods API call in full in `hooks/register.tsx`: `$.noun.method(...)`. Never assign `$` or a namespace to a variable, never destructure or index it.
- `$` may be passed only to functions declared at the top level of `register.tsx`, and to `read`/`update` from `claude-code`. Code in `hooks/<concern>/` never receives `$`: it receives a `Host` (see `hooks/host/`), an object of plain functions that `register.tsx` builds from `$` with each call spelled literally, as the built-in `diff` mod does.
- Event names in `on(...)` are string literals. Register each event once per matcher. No dynamic `import()`, no `require`, no Node APIs, no `setTimeout`/`setInterval` (use `$.clock`).
- `$.state` atoms (`atom({ plugin: 'herald', key: '...' } as const, initial)`) are consts at the top level of `register.tsx`: the scan does not follow atoms imported from another module, nor `read`/`update` called with an atom passed as a parameter. Concern code reaches state through the Host's per-key cells. Every key is spelled inline under `PluginState['herald']` in `types/index.d.ts`. A `ui.render` hook reads state and never writes it; writes happen in handlers and other events.
- `types/index.d.ts` exports types only and imports nothing.

## Design rules

- Least privilege: call only what a feature needs. Every `calls:` entry is justified in the README.
- Colors are theme keys (`ThemeKey`: `claude`, `suggestion`, `subtle`, `inactive`, `success`, `warning`, `error`, `text`, ...) or `dimColor`. Never a hex value or a named color like `'red'`.
- Glyphs are single-width text symbols, not emoji, except in toasts.
- Button hotkeys are one lowercase letter or one digit (the engine refuses anything else). Digits on the band also fire from an empty prompt, so the band uses letters only.
- Long-running work honours cancellation: pass `next.signal` (or the timer's own AbortController) to `$.model.complete` via its `signal` option and to `$.clock.sleep`, and bound model calls with `timeoutMs`. A hook's own execution time is 10 s (time inside `$` calls and `next` does not count).
- Failures never crash a hook: a failed fetch keeps the last items, logs one line with `$.ui.log(text, { to: 'debug' })`, and retries at the next interval. `$.model.complete` results are always checked with `isAnswered`.
- Feed and page content is untrusted data: model prompts say so, and extracted output is validated before use.
- Every `/herald` subcommand answers with `{ text }` as well, the fallback where nothing is drawn (VS Code panel, `claude -p`, cloud sessions).
- Copy-for-Claude copies to the clipboard; it never submits a prompt.

## Persisted and session state

- `$.store` keys (all owned by `hooks/store/`): `sources`, `settings`, `saved`, `seen` (ids per source), `items` (last items per source), `pageHashes`, `summaries` (cache keyed `<itemId>|<lang>|<kind>`, capped), `deps` (per project root: stack settings, followed dependencies, ignored and hand-added packages, manifest hashes, detection time; at most 20 projects, the least recently detected dropped), `depFeeds` (release feed per `<ecosystem>:<name>`, negative results and user overrides included; looked-up ones trusted for 7 days and capped at 500, overrides never expire or count), `releaseFlags` (Haiku's breaking and security verdict per release id `<ecosystem>:<name>|<entry id>`, capped), `stack` (per project root: each followed dependency's newest releases, seen release ids and last feed read; at most 5 projects, the least recently refreshed dropped).
- `$.state` mirrors what the drawings read. `hydrate` copies store into state at `session.start` and again on `classic.SessionStart` with `source` `clear`, `resume` or `fork`, because those reset `$.state` and do not fire `session.start`.
- `$.store` is shared by every session on the machine: read right before writing a value several sessions change.

## Tests

- `claude plugin test` with `claude-code/testing`: stub every `$` call the code under test makes (`mock.clock`, `mock.store`, `on('http.fetch', ...)`, `on('model.complete', ...)`, `on('process.run', ...)`, `on('ui.copy', ...)`).
- A test file is named for what it covers under `hooks/`, holds one `describe` titled with that name, and keeps shared data in `tests/fixtures/` (one export a file). Tests cannot read files: feed samples are `.ts` fixtures exporting the XML as a string.
- Each test has a 5 s budget by default and the suite runs on busy machines: keep inputs as small as the behaviour allows, give heavy tests an explicit generous `timeoutMs`, and prove linearity by scaling (time at 16N against time at N), never by an absolute bound at normal sizes.
- UI tests mount the band and the pane on `['terminal', 'desktop'] as const` and act by element `key`.

## Writing

- Code, comments, docs and commit messages in English. Comments are one line.
- Commits follow Conventional Commits (`feat`, `fix`, `test`, `refactor`, `docs`, `chore`), subject only or subject plus one or two short body lines, with no ticket or bead ids and no attribution trailers. One commit per logical step, tests in the same commit as the code they cover, every commit passing `scripts/check.sh`, reviewer fixes in commits of their own.
- Never commit secrets, real tokens, local absolute paths or generated files.
- Markdown prose is never hard-wrapped: one paragraph per line.
