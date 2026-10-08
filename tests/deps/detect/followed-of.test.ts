import { describe, expect, test } from 'claude-code/testing'

import Defaults from '../../../hooks/defaults'
import Detect from '../../../hooks/deps/detect'
import Fixtures from '../../fixtures'

describe('followed-of', () => {
  const SETTINGS = Defaults.DEFAULT_DEPS_SETTINGS

  test('ignored packages are never followed, and counted as detected', () => {
    const { followed, detectedCount } = Detect.followedOf(
      [Fixtures.depAt('react'), Fixtures.depAt('lodash'), Fixtures.depAt('react')],
      { settings: SETTINGS, ignored: ['npm:lodash'] },
    )

    expect(followed).toEqual([Fixtures.depAt('react')])
    expect(detectedCount).toBe(2)
  })

  test('added packages are followed after the detected ones, as detected when a manifest declares them too, dev ones included', () => {
    const zod = Fixtures.depAt('zod', { manifestPath: '' })
    const vitest = Fixtures.depAt('vitest', { isDev: true, versionInUse: '2.0.0' })
    const { followed } = Detect.followedOf([Fixtures.depAt('react'), vitest], {
      settings: SETTINGS,
      added: [zod, Fixtures.depAt('vitest', { manifestPath: '' })],
    })

    expect(followed).toEqual([Fixtures.depAt('react'), zod, vitest])
  })

  test('the cap counts added packages first, then the detected ones in the room left; an ignored added one is not followed', () => {
    const { followed } = Detect.followedOf(
      [Fixtures.depAt('a'), Fixtures.depAt('b'), Fixtures.depAt('c')],
      {
        settings: { ...SETTINGS, cap: 2 },
        ignored: ['npm:gone'],
        added: [Fixtures.depAt('x', { manifestPath: '' }), Fixtures.depAt('gone')],
      },
    )

    expect(followed.map(dependency => dependency.name)).toEqual(['a', 'x'])
  })
})
