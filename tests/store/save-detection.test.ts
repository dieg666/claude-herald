import { describe, expect, test } from 'claude-code/testing'

import Store from '../../hooks/store'
import Fixtures from '../fixtures'

describe('save-detection', () => {
  const DETECTION = {
    dependencies: [Fixtures.depAt('react')],
    detectedCount: 1,
    manifestHashes: { 'package.json': 'h1' },
  }

  test("keeps the project's settings and every other project as stored", async () => {
    const other = { settings: { cap: 3 }, dependencies: [], detectedCount: 0, manifestHashes: {} }
    const { host, stored } = Fixtures.fakeHostOf({
      deps: { '/repo': { settings: { includeDev: true } }, '/other': other },
    })

    const saved = await Store.saveDetection(host, '/repo', DETECTION)

    expect(saved).toEqual({
      settings: { isEnabled: true, includeDev: true, cap: 50 },
      ...DETECTION,
    })
    expect(stored.get('deps')).toEqual({ '/repo': saved, '/other': other })
  })

  test('replaces the previous detection of the same project', async () => {
    const { host } = Fixtures.fakeHostOf()

    await Store.saveDetection(host, '/repo', { ...DETECTION, detectedCount: 9 })
    await Store.saveDetection(host, '/repo', DETECTION)

    expect((await Store.loadDepsProject(host, '/repo')).detectedCount).toBe(1)
  })
})
