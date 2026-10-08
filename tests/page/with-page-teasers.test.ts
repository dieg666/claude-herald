import { describe, expect, test } from 'claude-code/testing'

import Page from '../../hooks/page'

describe('with-page-teasers', () => {
  const TEXT =
    'News\nExpanding the program <https://example.com/a>\nSecurity   researchers get\nwider access.\nOlder post'

  test('a teaser the page text holds is kept, whatever its case and spacing', () => {
    const item = {
      title: 'Expanding the program',
      url: 'https://example.com/a',
      teaser: 'security researchers GET wider access.',
    }

    expect(Page.withPageTeasers([item], TEXT)).toEqual([item])
  })

  test('a teaser the page text does not hold is dropped, the item kept', () => {
    expect(
      Page.withPageTeasers(
        [
          {
            title: 'Older post',
            url: 'https://example.com/b',
            publishedAt: '2026-10-01T00:00:00.000Z',
            teaser: 'An older post about the program, written by the model.',
          },
          { title: 'No teaser', url: 'https://example.com/c' },
        ],
        TEXT,
      ),
    ).toEqual([
      {
        title: 'Older post',
        url: 'https://example.com/b',
        publishedAt: '2026-10-01T00:00:00.000Z',
      },
      { title: 'No teaser', url: 'https://example.com/c' },
    ])
  })
})
