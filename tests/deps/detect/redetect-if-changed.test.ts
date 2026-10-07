import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'
import Fixtures from '../../fixtures'
import Npm from '../../fixtures/deps/npm'

describe('redetect-if-changed', () => {
  const detected = async (settings: object = {}) => {
    const fake = Fixtures.fakeHostOf({ deps: { '/repo': { settings } } })
    const fs = Fixtures.fakeFsOf('/repo', {
      '.git': { isDir: true },
      'package.json': Npm.REACT_PACKAGE_JSON,
      'yarn.lock': Npm.REACT_YARN_LOCK,
    })

    Object.assign(fake.host, fs)
    await Detect.detectDeps(fake.host)
    fake.sets.length = 0

    return { ...fake, fs }
  }

  test('nothing changed: no walk, no write', async () => {
    const { host, fs, sets } = await detected({ includeDev: true })
    const lists = fs.lists.length

    expect(await Detect.redetectIfChanged(host)).toBeUndefined()
    expect(sets).toEqual([])
    expect(fs.lists.length - lists).toBe(1)
  })

  test('a changed lockfile detects again with the new versions', async () => {
    const { host, fs } = await detected({ includeDev: true })

    fs.write('yarn.lock', Npm.REACT_YARN_LOCK.replace('version "3.29.5"', 'version "3.30.0"'))

    const project = await Detect.redetectIfChanged(host)

    expect(Fixtures.depNamed(project?.dependencies ?? [], 'rollup')?.versionInUse).toBe('3.30.0')
    expect(await Detect.manifestsChanged(host, '/repo')).toBe(false)
  })

  test('a project with its stack turned off is never checked', async () => {
    const { host, fs } = await detected({ isEnabled: false })
    const reads = fs.reads.length

    fs.write('yarn.lock', '')

    expect(await Detect.redetectIfChanged(host)).toBeUndefined()
    expect(fs.reads.length).toBe(reads)
  })
})
