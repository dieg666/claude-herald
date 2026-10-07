import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'
import Fixtures from '../fixtures/pages'

describe('content-hash-of', () => {
  test('equal text gives the same sixteen hex digits every time', () => {
    const text = Page.htmlToText(Fixtures.ANTHROPIC_NEWS_HTML, Fixtures.ANTHROPIC_NEWS_URL)

    expect(Page.contentHashOf(text)).toBe(Page.contentHashOf(text))
    expect(Page.contentHashOf(text)).toBe(Page.contentHashOf(`${text}`.slice()))
    expect(Page.contentHashOf(text)).toMatch(/^[0-9a-f]{16}$/)
  })

  test('a one-character change gives another value', () => {
    expect(Page.contentHashOf('hello world')).not.toBe(Page.contentHashOf('hello worle'))
    expect(Page.contentHashOf('hello world')).not.toBe(Page.contentHashOf('hello world '))
    expect(Page.contentHashOf('')).not.toBe(Page.contentHashOf(' '))
  })

  test('it is 64-bit FNV-1a, so the published vectors hold', () => {
    expect(Page.contentHashOf('')).toBe('cbf29ce484222325')
    expect(Page.contentHashOf('a')).toBe('af63dc4c8601ec8c')
    expect(Page.contentHashOf('foobar')).toBe('85944171f73967e8')
    expect(Page.contentHashOf('hello world')).toBe('779a65e7023cd2e7')
  })

  test('non-ASCII text is hashed as UTF-8 bytes', () => {
    expect(Page.contentHashOf('é')).toBe('0ac21707b7181e01')
    expect(Page.contentHashOf('日本語')).toBe('ee9ee2b5c854ef87')
    expect(Page.contentHashOf('😀')).toBe('feff073875020288')
    expect(Page.contentHashOf('é')).not.toBe(Page.contentHashOf('e'))
  })

  test('a lone surrogate hashes without throwing', () => {
    expect(Page.contentHashOf('\ud83d')).toMatch(/^[0-9a-f]{16}$/)
  })

  test('the hash of a page changes when a headline changes', () => {
    const before = Page.htmlToText(Fixtures.ANTHROPIC_NEWS_HTML, Fixtures.ANTHROPIC_NEWS_URL)
    const after = Page.htmlToText(
      Fixtures.ANTHROPIC_NEWS_HTML.replace(
        'Introducing Claude Opus 5.5',
        'Introducing Claude Opus 5.6',
      ),
      Fixtures.ANTHROPIC_NEWS_URL,
    )

    expect(Page.contentHashOf(before)).not.toBe(Page.contentHashOf(after))
  })
})
