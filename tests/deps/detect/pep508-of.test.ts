import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('pep508-of', () => {
  test('name and range, extras and markers dropped', () => {
    expect(Detect.pep508Of('pydantic[email] >=2, <3 ; python_version > "3.8"')).toEqual({
      name: 'pydantic',
      range: '>=2,<3',
    })
    expect(Detect.pep508Of('tzdata; platform_system == "Windows"')).toEqual({ name: 'tzdata' })
    expect(Detect.pep508Of('requests (>=2.0)')).toEqual({ name: 'requests', range: '>=2.0' })
  })

  test('a direct reference keeps its URL as the source', () => {
    expect(Detect.pep508Of('pkg @ https://example.com/pkg.whl ; os_name == "nt"')).toEqual({
      name: 'pkg',
      source: 'https://example.com/pkg.whl',
    })
  })

  test('text that names no package is not a requirement', () => {
    expect(Detect.pep508Of('>=1.0')).toBeUndefined()
  })
})
