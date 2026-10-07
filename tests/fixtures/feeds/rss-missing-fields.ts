/** RSS items each missing something: guid, link, title, a parseable date, a safe link, or everything. */
export const RSS_MISSING_FIELDS = `<rss version="2.0"><channel><title>Sparse</title>
<item><title>Link only</title><link>https://example.com/link-only</link></item>
<item><title>Guid not a permalink</title><guid isPermaLink="false">https://example.com/not-a-link</guid></item>
<item><title>Permalink guid</title><guid>https://example.com/permalink</guid></item>
<item><title>Title only</title></item>
<item><description>No title, only a &lt;b&gt;description&lt;/b&gt; that names the entry.</description></item>
<item><title>Bad date</title><pubDate>sometime last week</pubDate></item>
<item><title>Unsafe link</title><link>javascript:alert(1)</link></item>
<item></item>
<item><title>   </title><guid isPermaLink="false">opaque-id</guid></item>
</channel></rss>`
