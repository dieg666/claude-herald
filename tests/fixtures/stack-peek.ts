import type { Plugin } from 'claude-code/testing'

/**
 * A second mod whose `/peek-stack` answers the news mod's stack and pane state as JSON (null for a value never written).
 */
export const STACK_PEEK: Plugin = {
  name: 'peek-stack',
  register(on) {
    on('command.run', { command: 'peek-stack' }, async $ => ({
      text: JSON.stringify({
        stack: (await $.state.get({ plugin: 'news', key: 'stack' })).value ?? null,
        pane: (await $.state.get({ plugin: 'news', key: 'pane' })).value ?? null,
      }),
    }))
  },
}
