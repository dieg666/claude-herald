import { describe, expect, mock, test } from 'claude-code/testing'

import Actions from '../../hooks/actions'
import Fixtures from '../fixtures'

describe('save-item', () => {
  test('saves the item in the store and state, once', async () => {
    const { host, stored, state, sets } = Fixtures.fakeHostOf()
    const item = Fixtures.itemAt('a')

    expect(await Actions.saveItem(host, item)).toBe(true)
    expect(await Actions.saveItem(host, item)).toBe(true)
    expect(stored.get('saved')).toEqual([{ ...item, savedAt: 1000 }])
    expect(state.saved).toEqual([{ ...item, savedAt: 1000 }])
    expect(sets).toEqual(['saved'])
  })

  test('a store that fails is toasted, not thrown', async () => {
    const { host, toasts, logs } = Fixtures.fakeHostOf()

    host.storeSet = async () => {
      throw new Error('read-only')
    }

    expect(await Actions.saveItem(host, Fixtures.itemAt('a'))).toBe(false)
    expect(toasts).toEqual(['Could not save "a": read-only'])
    expect(logs).toEqual(['herald: could not save src:a: read-only'])
  })

  test(
    'v in the band saves the selected item to the store and state; its Button then reads Saved',
    { plugins: [Fixtures.STATE_PEEK], timeoutMs: 20_000 },
    async ($, on) => {
      mock.clock(on, { now: 5000 })

      const [first, second] = Fixtures.datedItemsOf('src', 2)
      const { stored, toasts } = Fixtures.bandOn(on, {
        sources: [Fixtures.sourceAt('src')],
        items: { src: [first, second] },
      })

      await $.classic.SessionStart({ source: 'clear' })

      for (const surface of ['terminal', 'desktop'] as const) {
        const ui = await $.ui.mount({
          plugin: 'herald',
          component: 'AbovePrompt',
          props: Fixtures.BAND_PROPS,
          surface,
        })

        expect((await ui.find({ key: 'save' }))?.props.label).toBe(
          surface === 'terminal' ? 'Save' : 'Saved',
        )

        await ui.press({ key: 'save' })

        expect((await ui.find({ key: 'save' }))?.props.label).toBe('Saved')

        await ui.press({ key: 'down' })

        expect((await ui.find({ key: 'save' }))?.props.label).toBe('Save')

        await ui.press({ key: 'up' })
        await ui.unmount()
      }

      const saved = [{ ...first, savedAt: 5000 }]

      expect(stored.get('saved')).toEqual(saved)
      expect(JSON.parse((await $.command.run(Fixtures.PEEK)).text ?? 'null').saved).toEqual(saved)
      expect(toasts).toEqual([])
    },
  )
})
