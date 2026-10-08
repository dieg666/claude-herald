import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'

describe('current-version-of', () => {
  test('the version in use wins over the range', () => {
    expect(
      Classify.currentVersionOf({ ecosystem: 'npm', versionInUse: '1.4.2', range: '^1.0.0' }),
    ).toBe('1.4.2')
  })

  test('without one, the floor of the range', () => {
    expect(Classify.currentVersionOf({ ecosystem: 'pypi', range: '>=2.1,<3' })).toBe('2.1')
  })

  test('an npm alias keeps only the aliased version', () => {
    expect(Classify.currentVersionOf({ ecosystem: 'npm', versionInUse: 'npm:other@1.5.0' })).toBe(
      '1.5.0',
    )
    expect(
      Classify.currentVersionOf({ ecosystem: 'npm', versionInUse: 'npm:@scope/other@2.0.0-rc.1' }),
    ).toBe('2.0.0-rc.1')
  })

  test('an unparseable version in use is kept as it is, not replaced by the range', () => {
    expect(
      Classify.currentVersionOf({
        ecosystem: 'npm',
        versionInUse: 'github:o/r#abc',
        range: '^1.0.0',
      }),
    ).toBe('github:o/r#abc')
  })

  test('neither a version nor a bounded range gives none', () => {
    expect(Classify.currentVersionOf({ ecosystem: 'npm' })).toBeUndefined()
    expect(
      Classify.currentVersionOf({ ecosystem: 'npm', versionInUse: ' ', range: '*' }),
    ).toBeUndefined()
  })
})
