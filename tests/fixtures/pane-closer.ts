import type { Plugin } from 'claude-code/testing'

/**
 * A second mod whose `/close-pane` closes the Herald pane through `$.ui.close`, the chain an Escape or the close mark raises too.
 */
export const PANE_CLOSER: Plugin = {
  name: 'closer',
  register(on) {
    on('command.run', { command: 'close-pane' }, async $ => {
      await $.ui.close({ id: 'herald' })

      return { text: 'closed' }
    })
  },
}
