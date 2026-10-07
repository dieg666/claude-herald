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
      detectedAt: 1000,
    })
    expect(stored.get('deps')).toEqual({ '/repo': saved, '/other': other })
  })

  test('replaces the previous detection of the same project', async () => {
    const { host } = Fixtures.fakeHostOf()

    await Store.saveDetection(host, '/repo', { ...DETECTION, detectedCount: 9 })
    await Store.saveDetection(host, '/repo', DETECTION)

    expect((await Store.loadDepsProject(host, '/repo')).detectedCount).toBe(1)
  })

  test('past the most projects kept, the least recently detected others are dropped', async () => {
    const projects = Object.fromEntries(
      Array.from({ length: Store.DEPS_PROJECTS_MAX }, (_, index) => [
        `/p${index}`,
        { settings: {}, dependencies: [], detectedCount: 0, manifestHashes: {}, detectedAt: index },
      ]),
    )
    const { host, stored } = Fixtures.fakeHostOf({
      deps: { ...projects, '/never': {} },
    })

    await Store.saveDetection(host, '/new', DETECTION)

    const kept = Object.keys(stored.get('deps') as object)

    expect(Store.DEPS_PROJECTS_MAX).toBe(20)
    expect(kept.length).toBe(20)
    expect(kept).toContain('/new')
    expect(kept).not.toContain('/never')
    expect(kept).not.toContain('/p0')
    expect(kept).toContain('/p1')
    expect(kept).toContain('/p19')
  })

  test('a project detected again keeps its place without counting twice', async () => {
    const projects = Object.fromEntries(
      Array.from({ length: Store.DEPS_PROJECTS_MAX }, (_, index) => [
        `/p${index}`,
        { detectedAt: index },
      ]),
    )
    const { host, stored } = Fixtures.fakeHostOf({ deps: projects })

    await Store.saveDetection(host, '/p0', DETECTION)

    expect(Object.keys(stored.get('deps') as object).sort()).toEqual(Object.keys(projects).sort())
  })
})
