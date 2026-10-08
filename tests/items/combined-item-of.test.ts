import { describe, expect, test } from 'claude-code/testing'

import Items from '../../hooks/items'
import Fixtures from '../fixtures'

describe('combined-item-of', () => {
  const FIRST = Fixtures.itemAt('first', '2026-01-01T00:00:00Z')

  test('a lone copy comes back under the given id', () => {
    expect(Items.combinedItemOf('src:other', [FIRST])).toEqual({ ...FIRST, id: 'src:other' })
  })

  test('the first copy wins every field it has', () => {
    const own = { ...FIRST, lang: 'es' }
    const second = { ...Fixtures.itemAt('second', '2026-02-02T00:00:00Z'), lang: 'en' }

    expect(Items.combinedItemOf('src:k', [own, second])).toEqual({ ...own, id: 'src:k' })
  })

  test('a date and a language the first copy lacks come from the first other copy that has them', () => {
    const { publishedAt, ...undated } = FIRST
    const none = Fixtures.itemAt('none')

    const dated = { ...Fixtures.itemAt('dated', '2026-02-02T00:00:00Z'), lang: 'en' }
    const later = { ...Fixtures.itemAt('later', '2026-03-03T00:00:00Z'), lang: 'fr' }

    expect(publishedAt).toBeDefined()
    expect(Items.combinedItemOf('src:k', [undated, none, dated, later])).toMatchObject({
      publishedAt: '2026-02-02T00:00:00Z',
      lang: 'en',
    })
  })

  test('no date or language anywhere leaves the keys out', () => {
    const { publishedAt, ...undated } = FIRST
    const result = Items.combinedItemOf('src:k', [undated])

    expect(publishedAt).toBeDefined()
    expect('publishedAt' in result).toBe(false)
    expect('lang' in result).toBe(false)
  })

  test('blank or label-only text is replaced by the next copy with text of its own', () => {
    const real = { ...Fixtures.itemAt('real'), text: 'Real text about the story' }

    for (const text of ['', '  ', 'Comments']) {
      expect(Items.combinedItemOf('src:k', [{ ...FIRST, text }, real]).text).toBe(real.text)
    }
  })

  test('text of its own on the first copy is kept, and none anywhere keeps the first text', () => {
    const real = { ...Fixtures.itemAt('real'), text: 'Real text about the story' }

    expect(Items.combinedItemOf('src:k', [real, FIRST]).text).toBe(real.text)
    expect(
      Items.combinedItemOf('src:k', [
        { ...FIRST, text: 'Comments' },
        { ...real, text: '' },
      ]).text,
    ).toBe('Comments')
  })
})
