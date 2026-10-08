import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'

describe('page-hash-of', () => {
  const REQUEST = Page.extractionRequestOf('https://example.com/news', 'line one\nline two')

  test('the same request gives the same sixteen hex digits', () => {
    expect(Page.pageHashOf(REQUEST)).toBe(Page.pageHashOf({ ...REQUEST }))
    expect(Page.pageHashOf(REQUEST)).toMatch(/^[0-9a-f]{16}$/)
  })

  test('other page text or other extraction rules give another value', () => {
    expect(Page.pageHashOf(REQUEST)).not.toBe(
      Page.pageHashOf(Page.extractionRequestOf('https://example.com/news', 'line one\nline 2')),
    )
    expect(Page.pageHashOf(REQUEST)).not.toBe(
      Page.pageHashOf({ ...REQUEST, system: `${REQUEST.system} ` }),
    )
  })

  test('differs from the hash of the page text alone, so pages read before the teaser rule are read again', () => {
    expect(Page.pageHashOf(REQUEST)).not.toBe(Page.contentHashOf('line one\nline two'))
  })
})
