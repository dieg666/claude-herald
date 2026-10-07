/** Atom text constructs of each type: text, html, xhtml, and CDATA inside text and html. */
export const ATOM_TITLE_TYPES = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="html">&lt;b&gt;Typed&lt;/b&gt; titles</title>
  <entry>
    <id>t1</id>
    <title>Use &lt;div&gt; tags</title>
    <summary>Plain &lt;div&gt; text</summary>
  </entry>
  <entry>
    <id>t2</id>
    <title type="html">&lt;em&gt;Emphasis&lt;/em&gt; &amp;amp; more</title>
    <content type="html">&lt;p&gt;HTML &lt;a href="x"&gt;content&lt;/a&gt;&lt;/p&gt;</content>
  </entry>
  <entry>
    <id>t3</id>
    <title type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml"><b>XHTML</b> title</div></title>
    <content type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml"><p>XHTML <i>content</i></p><p>two</p></div></content>
  </entry>
  <entry>
    <id>t4</id>
    <title type="text"><![CDATA[CDATA <text> title]]></title>
    <summary type="html"><![CDATA[<p>CDATA html summary</p>]]></summary>
    <content type="html">not used</content>
  </entry>
</feed>
`
