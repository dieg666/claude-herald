/** Atom entries whose links test alternate selection, non-page relations, relative hrefs under xml:base, and languages. */
export const ATOM_LINKS = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="de" xml:base="https://example.org/blog/">
  <title>Links</title>
  <link rel="self" href="https://example.org/feed.atom"/>
  <link href="https://example.org/"/>
  <entry>
    <title>Several links</title>
    <id>urn:uuid:1</id>
    <link rel="self" href="https://example.org/entries/1.atom"/>
    <link rel="enclosure" type="audio/mpeg" href="https://example.org/1.mp3"/>
    <link rel="alternate" type="text/html" href="https://example.org/entries/1"/>
    <updated>2026-10-01T10:00:00Z</updated>
  </entry>
  <entry>
    <title>No rel</title>
    <id>urn:uuid:2</id>
    <link rel="self" href="https://example.org/entries/2.atom"/>
    <link href="https://example.org/entries/2"></link>
    <published>2026-10-02T10:00:00.123-05:00</published>
    <updated>2026-10-03T00:00:00Z</updated>
  </entry>
  <entry xml:lang="en">
    <title>Relative link</title>
    <id>urn:uuid:3</id>
    <link rel="alternate" href="posts/3"/>
  </entry>
  <entry>
    <title>Only self and enclosure</title>
    <id>urn:uuid:4</id>
    <link rel="self" href="https://example.org/entries/4.atom"/>
    <link rel="enclosure" href="https://example.org/4.mp3"/>
  </entry>
  <entry>
    <title>Alternate in two types</title>
    <id>urn:uuid:5</id>
    <link rel="alternate" type="application/json" href="https://example.org/entries/5.json"/>
    <link rel="alternate" type="text/html" href="https://example.org/entries/5"/>
  </entry>
  <entry>
    <title>PDF alternate listed first</title>
    <id>urn:uuid:6</id>
    <link rel="alternate" type="application/pdf" href="https://example.org/entries/6.pdf"/>
    <link rel="replies" type="text/html" href="https://example.org/entries/6/comments"/>
    <link rel="alternate" type="text/html" href="https://example.org/entries/6"/>
  </entry>
  <entry>
    <title>Only an enclosure and replies</title>
    <id>urn:uuid:7</id>
    <link rel="enclosure" type="audio/mpeg" href="https://example.org/7.mp3"/>
    <link rel="replies" href="https://example.org/entries/7/comments"/>
  </entry>
  <entry>
    <title>A related link only</title>
    <id>urn:uuid:8</id>
    <link rel="edit" href="https://example.org/api/8"/>
    <link rel="related" href="https://example.org/elsewhere/8"/>
  </entry>
</feed>
`
