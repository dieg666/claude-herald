/** RSS with CDATA titles and bodies, named and numeric entities, and a content-only item. */
export const RSS_CDATA_AND_ENTITIES = `<?xml version="1.0" encoding="UTF-8"?>
<!-- a comment before the root -->
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title><![CDATA[Ben & Jerry's <Changelog>]]></title>
    <link>https://example.com/</link>
    <language>fr_FR</language>
    <item>
      <title><![CDATA[CDATA &amp; title]]></title>
      <link>https://example.com/a</link>
      <guid isPermaLink="false">item-a</guid>
      <description><![CDATA[<p>First <b>bold</b> paragraph.</p><p>Second&nbsp;one &#8211; done.</p>]]></description>
      <pubDate>Tue, 06 Oct 2026 09:30:00 GMT</pubDate>
    </item>
    <item>
      <title>AT&amp;amp;T caf&eacute; &#8217;quoted&#x2019;&nbsp;and&#160;spaced</title>
      <link>https://example.com/b</link>
      <description>&lt;p&gt;Escaped &lt;em&gt;markup&lt;/em&gt; &amp;amp; an ampersand&lt;/p&gt;</description>
      <dc:date>2026-10-05T08:00:00+02:00</dc:date>
    </item>
    <item>
      <title>Literal &lt;div&gt; in a title &lt;b&gt;with bold&lt;/b&gt;</title>
      <link>https://example.com/c</link>
      <content:encoded><![CDATA[<div><script>alert('x')</script><style>p { color: red }</style><!-- hidden --><p>Only content</p></div>]]></content:encoded>
    </item>
  </channel>
</rss>
`
