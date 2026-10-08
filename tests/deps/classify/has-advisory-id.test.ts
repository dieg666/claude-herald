import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'

describe('has-advisory-id', () => {
  test('a full CVE or GHSA id counts, any case', () => {
    for (const text of [
      'Fixes CVE-2024-3651.',
      'cve-2023-12345',
      'See GHSA-jfh8-c2jp-5v3q',
      'ghsa-jfh8-c2jp-5v3q',
    ]) {
      expect(Classify.hasAdvisoryId(text), text).toBe(true)
    }
  })

  test('a keyword or a partial id does not', () => {
    for (const text of [
      'security fix',
      'CVE-2024',
      'CVE-',
      'GHSA-jfh8',
      'xCVE-2024-1',
      'GHSA-jfh8-c2jp-5v3qq',
    ]) {
      expect(Classify.hasAdvisoryId(text), text).toBe(false)
    }
  })
})
