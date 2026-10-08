import { COMMAND_NAME } from '../names/command-name.js'
import { addFeed } from './add-feed.js'
import { addPage } from './add-page.js'
import { listSources } from './list-sources.js'
import { removeSource } from './remove-source.js'
import { resetNews } from './reset-news.js'
import { runDeps } from './run-deps.js'
import { setEnabled } from './set-enabled.js'
import { setLang } from './set-lang.js'
import { setRefreshInterval } from './set-refresh-interval.js'
import { setRotate } from './set-rotate.js'
import { setTemplate } from './set-template.js'
import type { Subcommand } from './subcommand.js'

/**
 * Every `/news` subcommand by the name typed after `/news`, in the order the usage lists them; a family such as `deps` is one entry that parses its own rest.
 */
export const SUBCOMMANDS: Readonly<Record<string, Subcommand>> = {
  add: {
    usage: 'add <url> [name]',
    summary: 'follow an RSS or Atom feed',
    needsArgument: true,
    run: addFeed,
  },
  'add-page': {
    usage: 'add-page <url> [name]',
    summary: 'follow a web page; Haiku reads its headlines',
    needsArgument: true,
    run: addPage,
  },
  remove: {
    usage: 'remove <name|url>',
    summary: 'stop following a source',
    needsArgument: true,
    run: removeSource,
  },
  list: {
    usage: 'list',
    summary: 'every source: on or off, kind, items, last error',
    needsArgument: false,
    run: listSources,
  },
  enable: {
    usage: 'enable <name>',
    summary: 'turn a source on',
    needsArgument: true,
    run: (host, rest) => setEnabled(host, rest, true),
  },
  disable: {
    usage: 'disable <name>',
    summary: 'turn a source off, keeping it',
    needsArgument: true,
    run: (host, rest) => setEnabled(host, rest, false),
  },
  interval: {
    usage: 'interval <minutes>',
    summary: 'minutes between refreshes, 1 to 1440 (default 5)',
    needsArgument: true,
    run: setRefreshInterval,
  },
  rotate: {
    usage: 'rotate <seconds>',
    summary: 'seconds between band pages, 5 to 3600 (default 20)',
    needsArgument: true,
    run: setRotate,
  },
  lang: {
    usage: 'lang <feed|user|code>',
    summary: "summary language: the item's, Claude Code's, or a code like es",
    needsArgument: true,
    run: setLang,
  },
  template: {
    usage: 'template <text>',
    summary: 'copy-for-Claude text with {title}, {url} and {source}',
    needsArgument: true,
    run: setTemplate,
  },
  reset: {
    usage: 'reset',
    summary: 'factory sources and default settings again; saved items stay',
    needsArgument: false,
    run: resetNews,
  },
  deps: {
    usage: 'deps',
    summary: `your stack's releases; /${COMMAND_NAME} deps help lists its subcommands`,
    needsArgument: false,
    run: runDeps,
  },
}
