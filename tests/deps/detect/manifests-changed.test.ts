import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'
import Fixtures from '../../fixtures'
import Npm from '../../fixtures/deps/npm'

describe('manifests-changed', () => {
  const detected = async () => {
    const fake = Fixtures.fakeHostOf()
    const fs = Fixtures.fakeFsOf('/repo', {
      '.git': { isDir: true },
      'package.json': Npm.REACT_PACKAGE_JSON,
      'yarn.lock': Npm.REACT_YARN_LOCK,
    })

    Object.assign(fake.host, fs)
    await Detect.detectDeps(fake.host)

    return { host: fake.host, fs }
  }

  test('false while every recorded file reads the same', async () => {
    const { host } = await detected()

    expect(await Detect.manifestsChanged(host, '/repo')).toBe(false)
  })

  test('true once a lockfile changes', async () => {
    const { host, fs } = await detected()

    fs.write('yarn.lock', `${Npm.REACT_YARN_LOCK}\n`)

    expect(await Detect.manifestsChanged(host, '/repo')).toBe(true)
  })

  test('true once a recorded manifest is gone', async () => {
    const { host, fs } = await detected()

    fs.remove('package.json')

    expect(await Detect.manifestsChanged(host, '/repo')).toBe(true)
  })

  test('false for a project with nothing recorded, without reading anything', async () => {
    const { host, fs } = await detected()
    const reads = fs.reads.length

    expect(await Detect.manifestsChanged(host, '/elsewhere')).toBe(false)
    expect(fs.reads.length).toBe(reads)
  })
})
