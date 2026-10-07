/** A synthetic RSS feed with `count` items, each with a guid, a link, an HTML description and a date. */
export function rssWithItems(count: number): string {
  const items = Array.from(
    { length: count },
    (_, index) =>
      `<item><title>Item ${index} &amp; more</title><link>https://example.com/${index}</link>` +
      `<guid>https://example.com/${index}</guid><description>&lt;p&gt;Body of item ${index}, ` +
      `${'with some words '.repeat(20)}&lt;/p&gt;</description><pubDate>Wed, 07 Oct 2026 12:00:00 +0000</pubDate></item>`,
  )

  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Big</title>${items.join('\n')}</channel></rss>`
}
