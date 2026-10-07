import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../../hooks/feed'
import Text from '../../../hooks/feed/text'

describe('clean-title', () => {
  test('double- and triple-encoded entities decode fully', () => {
    expect(Text.cleanTitle('AT&amp;T', false)).toBe('AT&T')
    expect(Text.cleanTitle('Tom &amp;amp; Jerry', false)).toBe('Tom & Jerry')
    expect(Text.cleanTitle('it&amp;#8217;s &amp;#x2019;', false)).toBe('it\u2019s \u2019')
  })

  test('an html title loses all its tags', () => {
    expect(Text.cleanTitle('<em>Big</em> <blink>news</blink>', true)).toBe('Big news')
  })

  test('a text title loses inline formatting tags only', () => {
    expect(Text.cleanTitle('<b>Bold</b> and <blink> & <a href="x">link</a>', false)).toBe(
      'Bold and <blink> & link',
    )
  })

  test('whitespace, including no-break spaces and newlines, collapses', () => {
    expect(Text.cleanTitle('\n  one&nbsp;\u00A0two\t\nthree  ', false)).toBe('one two three')
  })

  test('a very long title is capped with an ellipsis', () => {
    const title = Text.cleanTitle('word '.repeat(200), false)

    expect(title.length).toBeLessThanOrEqual(Feed.FEED_LIMITS.titleChars)
    expect(title).toEndWith('word\u2026')
  })
})
