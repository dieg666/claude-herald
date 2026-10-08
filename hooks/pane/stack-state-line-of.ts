import { COMMAND_NAME } from '../names/command-name.js'
import { collapsedTextOf } from '../page/collapsed-text-of.js'
import type { PaneStack } from './pane-stack.js'

/**
 * Why the stack tab lists nothing, and what changes it: no package matches the filter, the stack is off, detection has not run, no manifests or no dependencies were found, releases are still being looked up, no package has a release feed, the show level hides every release, or everything is up to date.
 *
 * @param stack what the stack tab draws from
 */
export function stackStateLineOf(stack: PaneStack): string {
  const command = `/${COMMAND_NAME} deps`
  const filter = collapsedTextOf(stack.filter).trim()

  if (filter !== '' && stack.items.length > 0) {
    return `No package matches "${filter}". Clear the filter to see all.`
  }

  if (stack.settings?.isEnabled === false) {
    return `Your stack is off in this project. ${command} on turns it on.`
  }

  const progress = stack.progress

  if (progress === undefined || !progress.isDetected) {
    return "Looking for this project's package manifests…"
  }

  if (progress.followed === 0) {
    if (progress.manifests === 0) {
      return 'No package manifests found in this project.'
    }

    return progress.detected > 0 && stack.settings?.includeDev === false
      ? `No runtime dependencies to follow. ${command} dev on follows dev ones too.`
      : "No dependencies found in this project's manifests."
  }

  const known = progress.checked + progress.unresolved

  if (known < progress.followed) {
    return `Checking your stack's releases: ${known} of ${progress.followed} packages so far…`
  }

  if (progress.checked === 0) {
    return `No release feed found for ${progress.followed === 1 ? 'your package' : `any of your ${progress.followed} packages`}. ${command} map <package> <owner/repo> sets one.`
  }

  if ((stack.hidden ?? 0) > 0) {
    return `No release at the ${stack.settings?.showLevel ?? 'minor+'} level. ${command} level all shows every release.`
  }

  return progress.unresolved === 0
    ? 'Everything in your stack is up to date.'
    : `Everything in your stack is up to date · ${progress.unresolved} without a release feed, listed by ${command}.`
}
