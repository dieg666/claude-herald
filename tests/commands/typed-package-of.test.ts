import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('typed-package-of', () => {
  test('an ecosystem by name or alias, any case, the name trimmed and kept whole after the first colon', () => {
    expect(Commands.typedPackageOf('NPM:@scope/pkg')).toEqual({
      ecosystem: 'npm',
      name: '@scope/pkg',
    })
    expect(Commands.typedPackageOf('java:org.slf4j:slf4j-api')).toEqual({
      ecosystem: 'maven',
      name: 'org.slf4j:slf4j-api',
    })
    expect(Commands.typedPackageOf('github: owner/repo ')).toEqual({
      ecosystem: 'github',
      name: 'owner/repo',
    })
  })

  test('no colon, an unknown prefix or a blank name is none', () => {
    for (const text of ['zod', 'cobol:x', 'npm:', ':zod', 'https://github.com/o/r']) {
      expect(Commands.typedPackageOf(text)).toBeUndefined()
    }
  })
})
