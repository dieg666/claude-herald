import { addDep } from './add-dep.js'
import { DEPS_USAGES } from './deps-usages.js'
import { mapDep } from './map-dep.js'
import { rescanDeps } from './rescan-deps.js'
import { setDepIgnored } from './set-dep-ignored.js'
import { setDepsCap } from './set-deps-cap.js'
import { setDepsDev } from './set-deps-dev.js'
import { setDepsEnabled } from './set-deps-enabled.js'
import { setDepsFilter } from './set-deps-filter.js'
import { setDepsLevel } from './set-deps-level.js'
import { setDepsTemplate } from './set-deps-template.js'
import { setDepsToast } from './set-deps-toast.js'
import type { Subcommand } from './subcommand.js'

/**
 * Every `/herald deps` subcommand by the name typed after `/herald deps`, in the order its usage lists them.
 */
export const DEPS_SUBCOMMANDS: Readonly<Record<keyof typeof DEPS_USAGES, Subcommand>> = {
  on: {
    usage: DEPS_USAGES.on,
    summary: "follow this project's dependency releases (default)",
    needsArgument: false,
    run: (host, rest, stack) => setDepsEnabled(host, rest, stack, true),
  },
  off: {
    usage: DEPS_USAGES.off,
    summary: 'stop following them here; other sources stay',
    needsArgument: false,
    run: (host, rest, stack) => setDepsEnabled(host, rest, stack, false),
  },
  rescan: {
    usage: DEPS_USAGES.rescan,
    summary: 'read the manifests again now',
    needsArgument: false,
    run: rescanDeps,
  },
  ignore: {
    usage: DEPS_USAGES.ignore,
    summary: 'never follow, look up or show a package (npm:name, or a bare name)',
    needsArgument: true,
    run: (host, rest, stack) => setDepIgnored(host, rest, stack, true),
  },
  unignore: {
    usage: DEPS_USAGES.unignore,
    summary: 'follow an ignored package again',
    needsArgument: true,
    run: (host, rest, stack) => setDepIgnored(host, rest, stack, false),
  },
  add: {
    usage: DEPS_USAGES.add,
    summary: 'follow a package no manifest declares, or a GitHub repository',
    needsArgument: true,
    run: addDep,
  },
  map: {
    usage: DEPS_USAGES.map,
    summary: "read a package's releases from that repository or feed, or off to undo it",
    needsArgument: true,
    run: mapDep,
  },
  dev: {
    usage: DEPS_USAGES.dev,
    summary: 'follow dev dependencies too (default off)',
    needsArgument: true,
    run: setDepsDev,
  },
  level: {
    usage: DEPS_USAGES.level,
    summary: 'what band and pane show: all, minor+, major+breaking+security or breaking+security',
    needsArgument: true,
    run: setDepsLevel,
  },
  toast: {
    usage: DEPS_USAGES.toast,
    summary: 'which new releases raise a toast (default breaking+security)',
    needsArgument: true,
    run: setDepsToast,
  },
  cap: {
    usage: DEPS_USAGES.cap,
    summary: 'follow at most that many dependencies (default 50)',
    needsArgument: true,
    run: setDepsCap,
  },
  template: {
    usage: DEPS_USAGES.template,
    summary: 'copy-for-Claude text with {pkg}, {current}, {new} and {url}',
    needsArgument: true,
    run: setDepsTemplate,
  },
  filter: {
    usage: DEPS_USAGES.filter,
    summary: "filter the pane's stack tab; nothing clears it",
    needsArgument: false,
    run: setDepsFilter,
  },
}
