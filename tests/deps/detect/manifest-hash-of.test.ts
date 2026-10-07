import { describe, expect, test } from 'claude-code/testing'

import Detect from '../../../hooks/deps/detect'

describe('manifest-hash-of', () => {
  test('stable for the same text, different for any edit, including a swap of two characters', () => {
    expect(Detect.manifestHashOf('{"a":"1.0.0"}')).toBe(Detect.manifestHashOf('{"a":"1.0.0"}'))
    expect(Detect.manifestHashOf('{"a":"1.0.0"}')).not.toBe(Detect.manifestHashOf('{"a":"1.0.1"}'))
    expect(Detect.manifestHashOf('ab')).not.toBe(Detect.manifestHashOf('ba'))
    expect(Detect.manifestHashOf('')).toMatch(/^0-[0-9a-f]{16}$/)
  })
})
