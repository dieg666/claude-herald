import type { Plugin } from 'claude-code/testing'

/**
 * A second mod whose `/peek` answers the news mod's `$.state` as JSON (null for a value never written), so a test reads what the mod wrote.
 */
export const STATE_PEEK: Plugin = {
  name: 'peek',
  register(on) {
    on('command.run', { command: 'peek' }, async $ => ({
      text: JSON.stringify({
        sources: (await $.state.get({ plugin: 'news', key: 'sources' })).value ?? null,
        settings: (await $.state.get({ plugin: 'news', key: 'settings' })).value ?? null,
        items: (await $.state.get({ plugin: 'news', key: 'items' })).value ?? null,
        saved: (await $.state.get({ plugin: 'news', key: 'saved' })).value ?? null,
        summaries: (await $.state.get({ plugin: 'news', key: 'summaries' })).value ?? null,
      }),
    }))
  },
}
