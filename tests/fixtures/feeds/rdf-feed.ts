/** An RSS 1.0 (RDF) feed, whose items sit beside the channel. */
export const RDF_FEED = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel rdf:about="https://example.net/">
    <title>RDF news</title>
    <link>https://example.net/</link>
    <dc:language>en</dc:language>
  </channel>
  <item rdf:about="https://example.net/1">
    <title>First RDF item</title>
    <link>https://example.net/1</link>
    <dc:date>2026-10-07T12:00:00Z</dc:date>
  </item>
</rdf:RDF>
`
