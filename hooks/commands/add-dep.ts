import type { Dependency } from '../../types/index.js'
import { depFeedKeyOf } from '../deps/resolve/dep-feed-key-of.js'
import { shorthandRepoOf } from '../deps/resolve/shorthand-repo-of.js'
import { mirrorStack } from '../deps/stack/mirror-stack.js'
import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { COMMAND_NAME } from '../names/command-name.js'
import { DEPS_LIST_MAX } from '../store/deps-list-max.js'
import { loadDepsProject } from '../store/load-deps-project.js'
import { updateDepsProject } from '../store/update-deps-project.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'
import { singleWordOf } from './single-word-of.js'
import { typedPackageOf } from './typed-package-of.js'

/**
 * What `deps add` follows: a package as `<ecosystem>:<name>`, or a GitHub repository (`owner/repo`, `github:owner/repo` or its URL) as a `github` package whose source is the repository; undefined for anything else.
 *
 * @param text what the person typed
 */
function addedOf(text: string): Dependency | undefined {
  const typed = typedPackageOf(text)
  const repo =
    typed === undefined
      ? shorthandRepoOf(text)
      : typed.ecosystem === 'github'
        ? shorthandRepoOf(typed.name)
        : undefined

  if (typed !== undefined && typed.ecosystem !== 'github') {
    return { ...typed, isDev: false, isRoot: true, manifestPath: '' }
  }

  return repo === undefined
    ? undefined
    : {
        ecosystem: 'github',
        name: repo,
        isDev: false,
        isRoot: true,
        manifestPath: '',
        source: `https://github.com/${repo}`,
      }
}

/**
 * `/herald deps add <ecosystem:package|owner/repo>`: follows a package no manifest declares (or one ignored or left out by the dev toggle or the cap) in this project, and asks for the stack to be detected again while it is on; refuses one followed already, a GitHub repository included when a followed package's source is that repository.
 *
 * @param host the engine
 * @param rest what follows `add`
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 */
export async function addDep(host: Host, rest: string, stack: StackLoop): Promise<CommandReply> {
  const typed = argumentOf(rest)
  const word = singleWordOf(rest)
  const dependency = word === undefined ? undefined : addedOf(word)

  if (dependency === undefined) {
    return depsRefusalOf(
      'add',
      `"${typed}" is neither <ecosystem>:<package> (e.g. npm:zod) nor a GitHub repository (owner/repo or its URL).`,
    )
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  const project = await loadDepsProject(host, at.root)
  const key = depFeedKeyOf(dependency)
  const repoKey = dependency.ecosystem === 'github' ? dependency.name.toLowerCase() : undefined
  const isIgnored = (project.ignored ?? []).includes(key)
  const followed = project.dependencies.find(
    other =>
      depFeedKeyOf(other) === key ||
      (repoKey !== undefined &&
        other.source !== undefined &&
        shorthandRepoOf(other.source)?.toLowerCase() === repoKey),
  )

  if (followed !== undefined && !isIgnored) {
    return depsRefusalOf('add', `${depFeedKeyOf(followed)} is followed already in ${at.root}.`)
  }

  const added = project.added ?? []
  const isAdded = added.some(other => depFeedKeyOf(other) === key)

  if (!isAdded && added.length >= DEPS_LIST_MAX) {
    return depsRefusalOf('add', `${at.root} has ${DEPS_LIST_MAX} packages added already.`)
  }

  await stack.serially(async () => {
    await updateDepsProject(host, at.root, stored => ({
      ...stored,
      dependencies: stored.dependencies.some(other => depFeedKeyOf(other) === key)
        ? stored.dependencies
        : [...stored.dependencies, dependency],
      ignored: (stored.ignored ?? []).filter(other => other !== key),
      added: (stored.added ?? []).some(other => depFeedKeyOf(other) === key)
        ? (stored.added ?? [])
        : [...(stored.added ?? []), dependency],
    }))
    await mirrorStack(host, at.root)
  })

  const note = project.settings.isEnabled
    ? ' Looking it up now.'
    : ` Your stack is off for this project; /${COMMAND_NAME} deps on turns it on.`

  return {
    text: `${isIgnored ? `${key} is no longer ignored and is followed` : `Following ${key}`} in ${at.root}.${note}`,
    ...(project.settings.isEnabled ? { rescanStack: true } : {}),
  }
}
