import { describe, expect, test } from 'claude-code/testing'

import Refresh from '../../hooks/refresh'

describe('items-of-extracted', () => {
  test('ids come from the addresses; dates kept, no text', () => {
    expect(
      Refresh.itemsOfExtracted('page', [
        { title: 'A', url: 'https://example.com/a', publishedAt: '2026-10-01T00:00:00.000Z' },
        { title: 'B', url: 'https://example.com/b' },
      ]),
    ).toEqual([
      {
        id: 'page:https://example.com/a',
        sourceId: 'page',
        title: 'A',
        url: 'https://example.com/a',
        publishedAt: '2026-10-01T00:00:00.000Z',
        text: '',
      },
      {
        id: 'page:https://example.com/b',
        sourceId: 'page',
        title: 'B',
        url: 'https://example.com/b',
        text: '',
      },
    ])
  })

  test("a teaser becomes the item's text", () => {
    expect(
      Refresh.itemsOfExtracted('page', [
        { title: 'A', url: 'https://example.com/a', teaser: 'What the page says about A.' },
      ]),
    ).toEqual([
      {
        id: 'page:https://example.com/a',
        sourceId: 'page',
        title: 'A',
        url: 'https://example.com/a',
        text: 'What the page says about A.',
      },
    ])
  })
})
