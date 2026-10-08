import { mirrorStack } from '../deps/stack/mirror-stack.js'
import type { StackLoop } from '../deps/stack/stack-loop.js'
import type { Host } from '../host/host.js'
import { argumentOf } from './argument-of.js'
import type { CommandReply } from './command-reply.js'
import { depsRefusalOf } from './deps-refusal-of.js'
import { depsRootOf } from './deps-root-of.js'

/**
 * The longest filter, in characters, as the pane's field takes it.
 */
const FILTER_CHARS = 100

/**
 * `/herald deps filter [text]`: sets the text the pane's stack tab filters this project's releases by (nothing clears it), the selection back at the top when it changed, and asks for what the pane shows now to be checked.
 *
 * @param host the engine
 * @param rest what follows `filter`
 * @param stack the stack loop, whose queue orders the stack's store and state writes
 */
export async function setDepsFilter(
  host: Host,
  rest: string,
  stack: StackLoop,
): Promise<CommandReply> {
  const filter = argumentOf(rest)

  if (filter.length > FILTER_CHARS) {
    return depsRefusalOf(
      'filter',
      `The filter is ${filter.length} characters; the most is ${FILTER_CHARS}.`,
    )
  }

  const at = await depsRootOf(host)

  if ('reply' in at) {
    return at.reply
  }

  await stack.serially(async () => {
    // The filter belongs to the project in state: mirroring another one first starts it blank.
    if ((await host.state.stack.read()).root !== at.root) {
      await mirrorStack(host, at.root)
    }

    if ((await host.state.stack.read()).filter !== filter) {
      await host.state.stack.update(current => ({ ...current, filter }))
      await host.state.pane.update(pane => ({ ...pane, selected: 0 }))
    }
  })

  return {
    text:
      filter === ''
        ? 'The stack tab shows every release again.'
        : `The stack tab shows the releases matching "${filter}".`,
    resyncSummaries: true,
  }
}
