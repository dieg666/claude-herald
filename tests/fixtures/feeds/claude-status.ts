/** A real sample of https://status.claude.com/history.rss, fetched 2026-10-07 and trimmed to 4 entries with long bodies cut. */
export const CLAUDE_STATUS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Claude Status - Incident History</title>
    <link>https://status.claude.com</link>
    <description>Statuspage</description>
    <pubDate>Wed, 07 Oct 2026 21:29:59 +0000</pubDate>
    <item>
      <title>Issue with spend limits</title>
      <description>
&lt;p&gt; &lt;small&gt;Oct &lt;var data-var=&apos;date&apos;&gt; 7&lt;/var&gt;, &lt;var data-var=&apos;time&apos;&gt;21:23&lt;/var&gt; UTC&lt;/small&gt;&lt;br&gt; &lt;strong&gt;Resolved&lt;/strong&gt; - We have identified an issue which resulted in some organizations to be incorrectly paused for having reached their spend limit, resulting in refused requests on the Claude API, Claude.ai, Claude Code, Claude Security, and Claude Cowork. This is now resolved. &lt;/p&gt;      </description>
      <pubDate>Wed, 07 Oct 2026 21:23:29 +0000</pubDate>
      <link>https://status.claude.com/incidents/vmys9qn874h4</link>
      <guid>https://status.claude.com/incidents/vmys9qn874h4</guid>
    </item>
    <item>
      <title>Elevated errors on platform.claude.com</title>
      <description>
&lt;p&gt; &lt;small&gt;Oct &lt;var data-var=&apos;date&apos;&gt; 7&lt;/var&gt;, &lt;var data-var=&apos;time&apos;&gt;17:28&lt;/var&gt; UTC&lt;/small&gt;&lt;br&gt; &lt;strong&gt;Identified&lt;/strong&gt; - We&apos;ve identified the cause of errors loading usage data. The Admin API usage report has recovered, and fixes for the platform.claude.com Usage and Rate limits pages are in progress. The most recent 30 minutes of usage may be delayed. Core functionality is not affected. &lt;/p&gt; &lt;p&gt; &lt;small&gt;Oct &lt;var data-var=&apos;date&apos;&gt; 7&lt;/var&gt;, &lt;var data-var=&apos;time&apos;&gt;16:36&lt;/var&gt; UTC&lt;/small&gt;&lt;br&gt; &lt;strong&gt;Update&lt;/strong&gt; - We are continuing to work on elevated errors affecting usage data on the platform.claude.com Usage and Rate limits pages and the Admin API usage report. A mitigation for the Usage page and the Admin API usage report is rolling out; once it is in place, the most recent usage may take about 30 minutes to appear there. Core functionality is not affected. &lt;/p&gt;</description>
      <pubDate>Wed, 07 Oct 2026 17:28:02 +0000</pubDate>
      <link>https://status.claude.com/incidents/978mjkgw6mh7</link>
      <guid>https://status.claude.com/incidents/978mjkgw6mh7</guid>
    </item>
    <item>
      <title>Elevated errors loading usage data on platform.claude.com</title>
      <description>
&lt;p&gt; &lt;small&gt;Oct &lt;var data-var=&apos;date&apos;&gt; 7&lt;/var&gt;, &lt;var data-var=&apos;time&apos;&gt;02:33&lt;/var&gt; UTC&lt;/small&gt;&lt;br&gt; &lt;strong&gt;Resolved&lt;/strong&gt; - This incident has been resolved. From 17:00 PT on October 6 / 00:00 UTC on October 7 to 18:40 PT on October 6 / 01:40 UTC on October 7, many requests to load usage data on the platform.claude.com Usage page and the Admin API usage report returned errors. &lt;/p&gt; &lt;p&gt; &lt;small&gt;Oct &lt;var data-var=&apos;date&apos;&gt; 7&lt;/var&gt;, &lt;var data-var=&apos;time&apos;&gt;01:20&lt;/var&gt; UTC&lt;/small&gt;&lt;br&gt; &lt;strong&gt;Investigating&lt;/strong&gt; - We are investigating elevated errors loading usage data on the platform.claude.com Usage page and the Admin API usage report endpoint since 5 PM PT. Messages API requests are not affected. We will provide an update as soon as possible. &lt;/p&gt;      </description>
      <pubDate>Wed, 07 Oct 2026 02:33:38 +0000</pubDate>
      <link>https://status.claude.com/incidents/wf2v8ms031sx</link>
      <guid>https://status.claude.com/incidents/wf2v8ms031sx</guid>
    </item>
    <item>
      <title>Elevated errors for Claude Opus 5.5</title>
      <description>
&lt;p&gt; &lt;small&gt;Oct &lt;var data-var=&apos;date&apos;&gt; 6&lt;/var&gt;, &lt;var data-var=&apos;time&apos;&gt;12:43&lt;/var&gt; UTC&lt;/small&gt;&lt;br&gt; &lt;strong&gt;Resolved&lt;/strong&gt; - The issue affecting Claude Opus 5.5 has been resolved. &lt;/p&gt; &lt;p&gt; &lt;small&gt;Oct &lt;var data-var=&apos;date&apos;&gt; 6&lt;/var&gt;, &lt;var data-var=&apos;time&apos;&gt;12:37&lt;/var&gt; UTC&lt;/small&gt;&lt;br&gt; &lt;strong&gt;Identified&lt;/strong&gt; - We have identified the cause of elevated errors on requests to Claude Opus 5.5 and are working on a fix. We will provide an update as soon as possible. &lt;/p&gt; &lt;p&gt; &lt;small&gt;Oct &lt;var data-var=&apos;date&apos;&gt; 6&lt;/var&gt;, &lt;var data-var=&apos;time&apos;&gt;12:24&lt;/var&gt; UTC&lt;/small&gt;&lt;br&gt; &lt;strong&gt;Investigating&lt;/strong&gt; - We are investigating elevated errors on requests to Claude Opus 5.5. We will provide an update as soon as possible. &lt;/p&gt;      </description>
      <pubDate>Tue, 06 Oct 2026 12:43:02 +0000</pubDate>
      <link>https://status.claude.com/incidents/ch27pb90bn85</link>
      <guid>https://status.claude.com/incidents/ch27pb90bn85</guid>
    </item>
  </channel>
</rss>
`
