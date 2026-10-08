import { describe, expect, test } from 'claude-code/testing'

import Commands from '../../hooks/commands'

describe('dep-key-parts-of', () => {
  test('splits at the first colon only', () => {
    expect(Commands.depKeyPartsOf('npm:react')).toEqual({ ecosystem: 'npm', name: 'react' })
    expect(Commands.depKeyPartsOf('maven:org.slf4j:slf4j-api')).toEqual({
      ecosystem: 'maven',
      name: 'org.slf4j:slf4j-api',
    })
  })
})
