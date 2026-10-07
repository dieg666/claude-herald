/** RSS with double-encoded HTML, unescaped HTML inside a description, and a triple-encoded title. */
export const RSS_NESTED_MARKUP = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Nested markup</title>
    <item>
      <title>Double encoded</title>
      <link>https://example.com/1</link>
      <description>&amp;lt;p&amp;gt;Double &amp;amp;amp; encoded&amp;lt;/p&amp;gt;&amp;lt;ul&amp;gt;&amp;lt;li&amp;gt;one&amp;lt;/li&amp;gt;&amp;lt;li&amp;gt;two&amp;lt;/li&amp;gt;&amp;lt;/ul&amp;gt;</description>
    </item>
    <item>
      <title>Raw markup</title>
      <link>https://example.com/2</link>
      <description><p>Raw <a href="https://example.com/x">markup</a><br> inside<img src="a.png"></p><p>a second paragraph</p></description>
    </item>
    <item>
      <title>Tom &amp;amp;amp; Jerry &amp;lt;3</title>
      <link>https://example.com/3</link>
    </item>
  </channel>
</rss>
`
