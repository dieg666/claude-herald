/** A real sample of https://github.com/anthropics/claude-agent-sdk-typescript/releases.atom, fetched 2026-10-07 and trimmed to 4 entries with long bodies cut. */
export const AGENT_SDK_TS_RELEASES = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xml:lang="en-US">
  <id>tag:github.com,2008:https://github.com/anthropics/claude-agent-sdk-typescript/releases</id>
  <link type="text/html" rel="alternate" href="https://github.com/anthropics/claude-agent-sdk-typescript/releases"/>
  <link type="application/atom+xml" rel="self" href="https://github.com/anthropics/claude-agent-sdk-typescript/releases.atom"/>
  <title>Release notes from claude-agent-sdk-typescript</title>
  <updated>2026-10-07T18:10:32Z</updated>
  <entry>
    <id>tag:github.com,2008:Repository/1065482259/v0.3.293</id>
    <updated>2026-10-07T18:10:38Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-agent-sdk-typescript/releases/tag/v0.3.293"/>
    <title>v0.3.293</title>
    <content type="html">&lt;h2&gt;What&#39;s changed&lt;/h2&gt;
&lt;ul&gt;
&lt;li&gt;Added an optional &lt;code&gt;subagent_type&lt;/code&gt; to &lt;code&gt;background_tasks_changed&lt;/code&gt; task entries, so hosts can name each subagent&#39;s type without pairing with &lt;code&gt;task_started&lt;/code&gt;&lt;/li&gt;
&lt;li&gt;Updated to parity with Claude Code v2.1.293&lt;/li&gt;</content>
    <author>
      <name>ashwin-ant</name>
    </author>
    <media:thumbnail height="30" width="30" url="https://avatars.githubusercontent.com/u/178951676?s=60&amp;v=4"/>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1065482259/v0.3.292</id>
    <updated>2026-10-06T18:59:14Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-agent-sdk-typescript/releases/tag/v0.3.292"/>
    <title>v0.3.292</title>
    <content type="html">&lt;h2&gt;What&#39;s changed&lt;/h2&gt;
&lt;ul&gt;
&lt;li&gt;Added &lt;code&gt;agent_id&lt;/code&gt; to the &lt;code&gt;assistant&lt;/code&gt; and &lt;code&gt;user&lt;/code&gt; messages a subagent produces; it equals the &lt;code&gt;task_id&lt;/code&gt; on that subagent&#39;s task events and stays the same when the subagent is resumed&lt;/li&gt;
&lt;li&gt;Added &lt;code&gt;parent_task_id&lt;/code&gt; to &lt;code&gt;task_started&lt;/code&gt; events and &lt;code&gt;background_tasks_changed&lt;/code&gt; entries, naming the subagent task that launched a task&lt;/li&gt;
&lt;li&gt;Added &lt;code&gt;run_id&lt;/code&gt; to background task events and &lt;code&gt;origin.runId&lt;/code&gt; to task notifications, so a host can tell a resumed task&#39;s runs apart&lt;/li&gt;
&lt;li&gt;Added typed &lt;code&gt;sections&lt;/code&gt; and &lt;code&gt;notes&lt;/code&gt; to the &lt;code&gt;ListAgents&lt;/code&gt; tool&#39;s &lt;code&gt;tool_use_result&lt;/code&gt;, so hosts can list agents without parsing its text&lt;/li&gt;</content>
    <author>
      <name>ashwin-ant</name>
    </author>
    <media:thumbnail height="30" width="30" url="https://avatars.githubusercontent.com/u/178951676?s=60&amp;v=4"/>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1065482259/v0.3.291</id>
    <updated>2026-10-06T03:54:57Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-agent-sdk-typescript/releases/tag/v0.3.291"/>
    <title>v0.3.291</title>
    <content type="html">&lt;h2&gt;What&#39;s changed&lt;/h2&gt;
&lt;ul&gt;
&lt;li&gt;Updated to parity with Claude Code v2.1.291&lt;/li&gt;
&lt;/ul&gt;
&lt;h2&gt;Update&lt;/h2&gt;
&lt;div class=&quot;highlight highlight-source-shell notranslate position-relative overflow-auto&quot; data-snippet-clipboard-copy-content=&quot;npm install @anthropic-ai/claude-agent-sdk@0.3.291
# or
yarn add @anthropic-ai/claude-agent-sdk@0.3.291
# or
pnpm add @anthropic-ai/claude-agent-sdk@0.3.291
# or
bun add @anthropic-ai/claude-agent-sdk@0.3.291&quot;&gt;&lt;pre&gt;npm install @anthropic-ai/claude-agent-sdk@0.3.291
&lt;span class=&quot;pl-c&quot;&gt;&lt;span class=&quot;pl-c&quot;&gt;#&lt;/span&gt; or&lt;/span&gt;
yarn add @anthropic-ai/claude-agent-sdk@0.3.291
&lt;span class=&quot;pl-c&quot;&gt;&lt;span class=&quot;pl-c&quot;&gt;#&lt;/span&gt; or&lt;/span&gt;
pnpm add @anthropic-ai/claude-agent-sdk@0.3.291
&lt;span class=&quot;pl-c&quot;&gt;&lt;span class=&quot;pl-c&quot;&gt;#&lt;/span&gt; or&lt;/span&gt;
bun add @anthropic-ai/claude-agent-sdk@0.3.291&lt;/pre&gt;&lt;/div&gt;</content>
    <author>
      <name>ashwin-ant</name>
    </author>
    <media:thumbnail height="30" width="30" url="https://avatars.githubusercontent.com/u/178951676?s=60&amp;v=4"/>
  </entry>
  <entry>
    <id>tag:github.com,2008:Repository/1065482259/v0.3.290</id>
    <updated>2026-10-05T23:32:50Z</updated>
    <link rel="alternate" type="text/html" href="https://github.com/anthropics/claude-agent-sdk-typescript/releases/tag/v0.3.290"/>
    <title>v0.3.290</title>
    <content type="html">&lt;h2&gt;What&#39;s changed&lt;/h2&gt;
&lt;ul&gt;
&lt;li&gt;Added an optional &lt;code&gt;offset&lt;/code&gt; field to the WebFetch tool input for reading on through long pages&lt;/li&gt;
&lt;li&gt;Fixed failed Claude in Chrome tool calls dropping the result&#39;s &lt;code&gt;_meta&lt;/code&gt;: when the result has one, &lt;code&gt;tool_use_result&lt;/code&gt; is now &lt;code&gt;{ content, _meta }&lt;/code&gt;, as for other MCP tools&lt;/li&gt;
&lt;li&gt;Fixed deny and ask rules missing &lt;code&gt;toolAliases&lt;/code&gt; tools when written with a wildcard (&lt;code&gt;Bash*&lt;/code&gt;), a match-all pattern (&lt;code&gt;Bash(**)&lt;/code&gt;, also on the mapped name), or an input field also in &lt;code&gt;disallowedTools&lt;/code&gt;&lt;/li&gt;
&lt;li&gt;Fixed a user message sent again under the same &lt;code&gt;uuid&lt;/code&gt; being replayed (&lt;code&gt;--replay-user-messages&lt;/code&gt;) while the first copy still waited for its turn; its replay now comes when a turn takes it&lt;/li&gt;</content>
    <author>
      <name>ashwin-ant</name>
    </author>
    <media:thumbnail height="30" width="30" url="https://avatars.githubusercontent.com/u/178951676?s=60&amp;v=4"/>
  </entry>
</feed>
`
