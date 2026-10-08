# Privacy policy

Effective 2026-10-08. Applies to the Herald plugin for Claude Code.

Herald is open-source software that runs on your machine inside Claude Code. Its author runs no server for it and collects no data: Herald has no telemetry, no analytics and no account, and it sends nothing to the author.

## What Herald reads

- The package manifests and lockfiles of the project you open in Claude Code, to find your dependencies. [Files stack detection reads](security.md#files-stack-detection-reads) lists them.
- The environment values `HOME`, `USERPROFILE` and `OS`, and Claude Code's `language` setting.

It never reads your prompts, your conversation or what Claude does in your session.

## What Herald sends, and to whom

- Requests to the news sources you have on and to any feed or page address you add.
- While Your stack is on: package names (and for NuGet and Maven the version you use) to the package registries of your project's ecosystems, and repository paths to GitHub, to find releases.
- Item and release text to Haiku through your own Claude Code session, under your own Claude plan or API key.

These third parties handle the requests under their own privacy policies. [What leaves your machine](security.md#what-leaves-your-machine) and [Network hosts](security.md#network-hosts) list every host and when it is contacted.

## What Herald stores

Its sources, settings, saved items, cached feed items, summaries and the dependency data of your projects, in one JSON file in Claude Code's plugin store on your machine. It stays there until you delete it ([Delete stored data](how-to.md#delete-stored-data)). Nothing is stored anywhere else.

## Changes and contact

Changes to this policy are made in this file, and its history is the record of them. For questions, open an issue at <https://github.com/dieg666/claude-herald/issues>.
