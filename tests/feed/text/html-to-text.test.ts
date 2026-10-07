import { describe, expect, test } from 'claude-code/testing'

import Feed from '../../../hooks/feed'
import Text from '../../../hooks/feed/text'

describe('html-to-text', () => {
  test('block tags separate words, inline tags do not', () => {
    expect(
      Text.htmlToText(
        '<h2>Title</h2><p>one<b>two</b></p><ul><li>a</li><li>b</li></ul>line<br/>break',
      ),
    ).toBe('Title onetwo a b line break')
  })

  test('scripts, styles, head, comments and a doctype leave no text', () => {
    expect(
      Text.htmlToText(
        '<!DOCTYPE html><html><head><title>T</title></head><body><script>x()</script><style>p{}</style><!-- c -->' +
          '<p>kept</p></body></html>',
      ),
    ).toBe('kept')
  })

  test('entities decode after the tags are gone', () => {
    expect(Text.htmlToText('<p>a&nbsp;&amp;&#8217;b &lt;div&gt;</p>')).toBe('a &\u2019b <div>')
  })

  test('double- and triple-encoded markup is unwrapped when no real tag is present', () => {
    expect(Text.htmlToText('&lt;p&gt;Hello &amp;amp; bye&lt;/p&gt;')).toBe('Hello & bye')
    expect(Text.htmlToText('&amp;lt;p&amp;gt;Deep&amp;lt;/p&amp;gt;')).toBe('Deep')
  })

  test('escaped code inside real markup stays literal', () => {
    expect(Text.htmlToText('<p>Use <code>&lt;div&gt;</code> here</p>')).toBe('Use <div> here')
  })

  test('a lone angle bracket is text; an unterminated tag is dropped', () => {
    expect(Text.htmlToText('a < b and 3<4')).toBe('a < b and 3<4')
    expect(Text.htmlToText('kept <a href="cut')).toBe('kept')
  })

  test('control characters are removed so a feed cannot drive the terminal', () => {
    expect(Text.htmlToText('<p>\u001b[31mred\u001b[0m &#27;x\u009b</p>')).toBe('[31mred[0m x')
  })

  test('only the start of a huge body is read', () => {
    expect(Text.htmlToText(`<p>${'a'.repeat(100_000)}</p>`)).toHaveLength(
      Feed.FEED_LIMITS.htmlSourceChars - 3,
    )
  })
})
