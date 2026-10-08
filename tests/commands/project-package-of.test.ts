import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'
import Fixtures from '../fixtures'

describe('project-package-of', () => {
  const CANDIDATES = [
    Fixtures.depAt('requests'),
    Fixtures.depAt('Requests', { ecosystem: 'pypi' }),
    Fixtures.depAt('React'),
    Fixtures.depAt('com.google.guava:guava', { ecosystem: 'maven' }),
  ]

  test('ecosystem:name by name or alias, spelled as the candidate it names', () => {
    expect(Commands.projectPackageOf('python:requests', CANDIDATES)).toEqual({
      pkg: { ecosystem: 'pypi', name: 'Requests' },
    })
    expect(Commands.projectPackageOf('RUST:serde', CANDIDATES)).toEqual({
      pkg: { ecosystem: 'cargo', name: 'serde' },
    })
  })

  test('a bare name one candidate has, exactly or ignoring case; a Maven name is a bare name', () => {
    expect(Commands.projectPackageOf('react', CANDIDATES)).toEqual({
      pkg: { ecosystem: 'npm', name: 'React' },
    })
    expect(Commands.projectPackageOf('com.google.guava:guava', CANDIDATES)).toEqual({
      pkg: { ecosystem: 'maven', name: 'com.google.guava:guava' },
    })
  })

  test('a bare name several ecosystems share, or none has, is refused', () => {
    expect(Commands.projectPackageOf('REQUESTS', CANDIDATES)).toEqual({
      error: '"REQUESTS" names npm:requests and pypi:Requests; write the one you mean.',
    })
    expect(Commands.projectPackageOf('zod', CANDIDATES)).toEqual({
      error: 'No package here is named "zod"; write it as <ecosystem>:<name>, e.g. npm:zod.',
    })
  })
})
