/** A real sample of https://github.com/anthropics/claude-code/releases.atom, fetched 2026-10-07 and trimmed to 4 entries with long bodies cut. */
export const CLAUDE_CODE_RELEASES = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xml:lang="en-US">
  <id>tag:github.com,2008:https://github.com/anthropics/claude-code/releases</id>
  <link type="text/html" rel="alternate" href="https://github.com/anthropics/claude-code/releases"/>
  <link type="application/atom+xml" rel="self" href="https://github.com/anthropics/claude-code/releases.atom"/>
  <title>Release notes from claude-code</title>
  <updated>2026-10-07T18:10:04Z</updated>
  <entry>
    <id>tag:github.com,2008:Repository/937253475/v2.1.293</id>
    <updated>2026-10-07T18:10:20Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-code/releases/tag/v2.1.293"/>
    <title>v2.1.293</title>
    <content type="html">&lt;h2&gt;What&#39;s changed&lt;/h2&gt;
&lt;ul&gt;
&lt;li&gt;Added Claude Haiku 5.5 (&lt;code&gt;claude-haiku-5-5&lt;/code&gt;), now the default Haiku model on the Anthropic API — 1M context, $0.10/$0.50 per Mtok ($0.50/$2.50 for prompts over 100K)&lt;/li&gt;
&lt;li&gt;Added &lt;code&gt;agentType&lt;/code&gt; to the &lt;code&gt;subagentStatusLine&lt;/code&gt; payload, so scripts can tell custom subagent types apart&lt;/li&gt;
&lt;li&gt;Added &lt;code&gt;isDeferred&lt;/code&gt; to &lt;code&gt;$.tool.register&lt;/code&gt; for mods: &lt;code&gt;false&lt;/code&gt; lists the tool&#39;s schema in the prompt from the start instead of behind tool search&lt;/li&gt;
&lt;li&gt;Fixed Claude sometimes treating its own last actions before a context compaction as done after it, and retracting or redoing finished work&lt;/li&gt;
&lt;li&gt;Fixed a memory leak where an HTTP MCP connection kept every request it had sent until it closed&lt;/li&gt;
&lt;li&gt;Fixed a message sent while Claude was working being lost when &lt;code&gt;←&lt;/code&gt; moved the session to the background; if a queued message can&#39;t move, &lt;code&gt;←&lt;/code&gt; now stays put and says so&lt;/li&gt;</content>
    <author>
      <name>ashwin-ant</name>
    </author>
    <media:thumbnail height="30" width="30" url="https://avatars.githubusercontent.com/u/178951676?s=60&amp;v=4"/>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/937253475/v2.1.292</id>
    <updated>2026-10-06T18:59:30Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-code/releases/tag/v2.1.292"/>
    <title>v2.1.292</title>
    <content type="html">&lt;h2&gt;What&#39;s changed&lt;/h2&gt;
&lt;ul&gt;
&lt;li&gt;Added &lt;code&gt;--marketplace &amp;lt;source&amp;gt;&lt;/code&gt; to &lt;code&gt;claude plugin install&lt;/code&gt;: adds the marketplace if needed, under the same policy checks as &lt;code&gt;claude plugin marketplace add&lt;/code&gt;, then installs the plugin from it&lt;/li&gt;
&lt;li&gt;Added an &lt;code&gt;effort&lt;/code&gt; parameter to the Agent tool, so Claude runs a sub-agent at the effort level you ask for&lt;/li&gt;
&lt;li&gt;Added &lt;code&gt;CLAUDE_CODE_OVERLOADED_RETRY_BASE_DELAY_MS&lt;/code&gt; environment variable to set a longer base delay for the backoff when retrying an overloaded (529) request&lt;/li&gt;
&lt;li&gt;Added &lt;code&gt;prompt.autocomplete&lt;/code&gt;, an event a mod hooks to add its own rows to the prompt box&#39;s autocomplete list&lt;/li&gt;
&lt;li&gt;Added prompt caching to &lt;code&gt;$.model.complete&lt;/code&gt; for mods: &lt;code&gt;prompt&lt;/code&gt; and &lt;code&gt;system&lt;/code&gt; take blocks of text, and &lt;code&gt;cache: true&lt;/code&gt; on a block caches the request up to it&lt;/li&gt;</content>
    <author>
      <name>ashwin-ant</name>
    </author>
    <media:thumbnail height="30" width="30" url="https://avatars.githubusercontent.com/u/178951676?s=60&amp;v=4"/>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/937253475/v2.1.291</id>
    <updated>2026-10-06T03:55:19Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-code/releases/tag/v2.1.291"/>
    <title>v2.1.291</title>
    <content type="html">&lt;h2&gt;What&#39;s changed&lt;/h2&gt;
&lt;ul&gt;
&lt;li&gt;Fixed a regression in 2.1.290 where cloud sessions could drop answers to permission prompts&lt;/li&gt;
&lt;li&gt;Fixed a regression in 2.1.288 where the last messages of a session could be lost when quitting&lt;/li&gt;
&lt;/ul&gt;</content>
    <author>
      <name>ashwin-ant</name>
    </author>
    <media:thumbnail height="30" width="30" url="https://avatars.githubusercontent.com/u/178951676?s=60&amp;v=4"/>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/937253475/v2.1.290</id>
    <updated>2026-10-05T23:33:17Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-code/releases/tag/v2.1.290"/>
    <title>v2.1.290</title>
    <content type="html">&lt;h2&gt;What&#39;s changed&lt;/h2&gt;
&lt;ul&gt;
&lt;li&gt;Added &lt;code&gt;serverToolUses&lt;/code&gt; to the result of a mod&#39;s &lt;code&gt;turn.step&lt;/code&gt; hook: the tool calls the API ran itself (the advisor), each with its id, name, input, start and end&lt;/li&gt;
&lt;li&gt;Added &lt;code&gt;agentId&lt;/code&gt; to the &lt;code&gt;tool.check&lt;/code&gt; event of plugin hooks, so a hook can tell a subagent&#39;s permission check from the main session&#39;s&lt;/li&gt;
&lt;li&gt;Added &lt;code&gt;ceiling&lt;/code&gt; to the question and verdict a mod&#39;s &lt;code&gt;tool.check&lt;/code&gt; hook reads, naming the approval an organization requires for a tool&lt;/li&gt;
&lt;li&gt;Added &lt;code&gt;ThemeKey&lt;/code&gt; and &lt;code&gt;Color&lt;/code&gt; types to the plugin hooks typings, so an editor lists the theme colors a mod&#39;s drawing can name&lt;/li&gt;
&lt;li&gt;Added to &lt;code&gt;claude plugin validate&lt;/code&gt;: each hook a mod registers at a gating site is listed with whether it has a &lt;code&gt;.catch&lt;/code&gt; (&lt;code&gt;gatingHooks&lt;/code&gt; under &lt;code&gt;--json&lt;/code&gt;)&lt;/li&gt;</content>
    <author>
      <name>ashwin-ant</name>
    </author>
    <media:thumbnail height="30" width="30" url="https://avatars.githubusercontent.com/u/178951676?s=60&amp;v=4"/>
  </entry>
</feed>
`
