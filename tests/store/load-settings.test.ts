import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../hooks/defaults'
import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('load-settings', () => {
  test('an empty store reads the default settings', async () => {
    const { host } = Fixtures.fakeHostOf()

    expect(await Store.loadSettings(host)).toEqual(Defaults.DEFAULT_SETTINGS)
  })

  test('a stored partial object comes back with every default filled', async () => {
    const { host } = Fixtures.fakeHostOf({ settings: { lang: 'es' } })

    expect(await Store.loadSettings(host)).toEqual({ ...Defaults.DEFAULT_SETTINGS, lang: 'es' })
  })

  test('saved settings load back', async () => {
    const { host } = Fixtures.fakeHostOf()
    const own = { ...Defaults.DEFAULT_SETTINGS, rotateSeconds: 45 }

    await Store.saveSettings(host, own)

    expect(await Store.loadSettings(host)).toEqual(own)
  })
})
