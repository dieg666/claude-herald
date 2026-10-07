import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('update-settings', () => {
  test('changes the fields given, keeps the stored ones and fills the rest', async () => {
    const { host, stored } = Fixtures.fakeHostOf({ settings: { lang: 'es' } })

    const settings = await Store.updateSettings(host, { rotateSeconds: 9 })

    expect(settings).toEqual({ ...Defaults.DEFAULT_SETTINGS, lang: 'es', rotateSeconds: 9 })
    expect(stored.get('settings')).toEqual(settings)
  })

  test("reads the store right before writing, keeping another session's change", async () => {
    const { host, stored } = Fixtures.fakeHostOf({ settings: { lang: 'es' } })

    stored.set('settings', { lang: 'fr' })
    await Store.updateSettings(host, { refreshMinutes: 2 })

    expect(stored.get('settings')).toMatchObject({ lang: 'fr', refreshMinutes: 2 })
  })
})
