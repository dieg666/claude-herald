import { describe, expect, test } from 'claude-code/testing'

import Band from '../../hooks/band'

describe('news-headline-of', () => {
  test('a title that is only a version leads with the source name and draws none at the right end', () => {
    expect(Band.newsHeadlineOf('v2.1.293', 'Claude Code', 80)).toEqual({
      title: 'Claude Code v2.1.293',
    })
  })

  test('a headline gets the name at the right end, ending at the last cell', () => {
    const line = Band.newsHeadlineOf('Claude Haiku 5.5', 'Simon Willison', 40)

    expect(line).toEqual({
      title: 'Claude Haiku 5.5',
      source: 'Simon Willison',
      sourceGap: ' '.repeat(10),
    })
  })

  test('a missing or blank source name leaves the headline alone', () => {
    expect(Band.newsHeadlineOf('Claude Haiku 5.5', undefined, 40)).toEqual({
      title: 'Claude Haiku 5.5',
    })
    expect(Band.newsHeadlineOf('Claude Haiku 5.5', '', 40)).toEqual({ title: 'Claude Haiku 5.5' })
    expect(Band.newsHeadlineOf('v1.0.0', undefined, 40)).toEqual({ title: 'v1.0.0' })
  })

  test('a long title drops the name and is cut only when it alone is too wide', () => {
    const title = 'Margaret Hamilton, who led the Apollo software, has died'

    expect(Band.newsHeadlineOf(title, 'Hacker News', 58)).toEqual({ title })
    expect(Band.newsHeadlineOf(title, 'Hacker News', 30)).toEqual({
      title: 'Margaret Hamilton, who led th…',
    })
  })

  test('a name is cut to the room the headline leaves', () => {
    expect(Band.newsHeadlineOf('A thirty-cell long headline ok', 'Hacker News', 40)).toEqual({
      title: 'A thirty-cell long headline ok',
      source: 'Hacker…',
      sourceGap: '   ',
    })
  })
})
