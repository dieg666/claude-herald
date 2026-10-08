import { describe, expect, test } from 'claude-code/testing'

import Classify from '../../../hooks/deps/classify'

/** A title or notes text and the flags its keywords raise. */
const TEXTS: readonly (readonly [string, Classify.ClassifiedRelease['flags']])[] = [
  ['Fixes CVE-2024-3651 in the parser', { breaking: false, security: true }],
  ['See GHSA-jfh8-c2jp-5v3q', { breaking: false, security: true }],
  ['cve-2023-1', { breaking: false, security: true }],
  ['Security: tighten redirects', { breaking: false, security: true }],
  ['security-related cleanups', { breaking: false, security: true }],
  ['A VULNERABILITY in auth was fixed', { breaking: false, security: true }],
  ['several vulnerabilities fixed', { breaking: false, security: true }],
  ['BREAKING CHANGE: drop Node 18', { breaking: true, security: false }],
  ['Breaking changes', { breaking: true, security: false }],
  ['breaking: removed `foo`', { breaking: true, security: false }],
  ['Add Securityscorecard badge', { breaking: false, security: false }],
  ['unbreaking the build', { breaking: false, security: false }],
  ['non-breaking change to logs', { breaking: false, security: false }],
  ['No breaking changes in this release', { breaking: false, security: false }],
  ['non-security fix', { breaking: false, security: false }],
  ['CVEs page link, xGHSA-1', { breaking: false, security: false }],
  ['Bump lodash', { breaking: false, security: false }],
  ['Breaking: fix CVE-2024-1 too', { breaking: true, security: true }],
]

describe('keyword-flags-of', () => {
  test('whole keywords in any case raise the flags, negations and longer words do not', () => {
    for (const [text, flags] of TEXTS) {
      expect(Classify.keywordFlagsOf(text), text).toEqual(flags)
    }
  })

  test('a keyword deep in the notes counts', () => {
    expect(
      Classify.keywordFlagsOf(`v1.2.3\n${'Fixed a bug. '.repeat(30)}Patched CVE-2025-0001.`),
    ).toEqual({
      breaking: false,
      security: true,
    })
  })
})
