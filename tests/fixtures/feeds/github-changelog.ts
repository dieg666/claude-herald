/** A real sample of https://github.blog/changelog/feed/, fetched 2026-10-07 and trimmed to 4 entries with long bodies cut. */
export const GITHUB_CHANGELOG = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"
	xmlns:content="http://purl.org/rss/1.0/modules/content/"
	xmlns:wfw="http://wellformedweb.org/CommentAPI/"
	xmlns:dc="http://purl.org/dc/elements/1.1/"
	xmlns:atom="http://www.w3.org/2005/Atom"
	xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
	xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
	>

<channel>
	<title>Archive: 2026 - GitHub Changelog</title>
	<atom:link href="https://github.blog/changelog/feed/" rel="self" type="application/rss+xml" />
	<link>https://github.blog/changelog/</link>
	<description>Updates, ideas, and inspiration from GitHub to help developers build and design software.</description>
	<lastBuildDate>Wed, 07 Oct 2026 20:39:09 +0000</lastBuildDate>
	<language>en-US</language>
	<sy:updatePeriod>
	hourly	</sy:updatePeriod>
	<sy:updateFrequency>
	1	</sy:updateFrequency>
	<generator>https://wordpress.org/?v=7.1.3</generator>

<image>
	<url>https://github.blog/wp-content/uploads/2019/01/cropped-github-favicon-512.png?fit=32%2C32</url>
	<title>Archive: 2026 - GitHub Changelog</title>
	<link>https://github.blog/changelog/</link>
	<width>32</width>
	<height>32</height>
</image> 
<site xmlns="com-wordpress:feed-additions:1">153214340</site>	<item>
		<title>Claude Haiku 5.5 in GitHub Copilot</title>
		<link>https://github.blog/changelog/2026-10-07-claude-haiku-5-5-in-github-copilot</link>
		
		<dc:creator><![CDATA[Allison]]></dc:creator>
		<pubDate>Wed, 07 Oct 2026 20:12:18 +0000</pubDate>
				<guid isPermaLink="false">https://github.blog/changelog/2026-10-07-claude-haiku-5-5-in-github-copilot</guid>

					<description><![CDATA[<p>Claude Haiku 5.5, Anthropic&#8217;s newest lightweight model, is now generally available in GitHub Copilot. It is designed for fast, high-volume work like subagents, quick edits, and terminal tasks. In early&#8230;</p>
<p>The post <a href="https://github.blog/changelog/2026-10-07-claude-haiku-5-5-in-github-copilot">Claude Haiku 5.5 in GitHub Copilot</a> appeared first on <a href="https://github.blog">The GitHub Blog</a>.</p>
]]></description>
										<content:encoded><![CDATA[<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">
<html><body><p>Claude Haiku 5.5, Anthropic&rsquo;s newest lightweight model, is now generally available in GitHub Copilot. It is designed for fast, high-volume work like subagents, quick edits, and terminal tasks. In early testing, Haiku 5.5 matched Claude Sonnet 5 on many coding tasks while using significantly fewer tokens and steps.</p>
<p>This model is billed at provider list pricing under usage-based billing. See <a href="https://docs.github.com/copilot/reference/copilot-billing/models-and-pricing">Models and pricing for GitHub Copilot</a> for details.</p>
<h3 id="availability-in-github-copilot" id="availability-in-github-copilot" ><a class="heading-link" href="#availability-in-github-copilot">Availability in GitHub Copilot<span class="heading-hash pl-2 text-italic text-bold" aria-hidden="true"></span></a></h3>
<p>Claude Haiku 5.5 is available to Copilot Pro, Pro+, Max, Business, and Enterprise users. You can select the model in the model picker in:</p>
<ul>
<li>Visual Studio Code</li>
<li>Visual Studio</li>
<li>Copilot CLI</li>
<li>GitHub Copilot cloud agent</li>
]]></content:encoded>
					
		
		
		<category domain="changelog-type"><![CDATA[Release]]></category>
<category domain="changelog-label"><![CDATA[copilot]]></category>
<post-id xmlns="com-wordpress:feed-additions:1">99370</post-id>	</item>
		<item>
		<title>Purpose-built model for leaked secret detection</title>
		<link>https://github.blog/changelog/2026-10-07-purpose-built-model-for-leaked-secret-detection</link>
		
		<dc:creator><![CDATA[Allison]]></dc:creator>
		<pubDate>Wed, 07 Oct 2026 16:13:56 +0000</pubDate>
				<guid isPermaLink="false">https://github.blog/changelog/2026-10-07-purpose-built-model-for-leaked-secret-detection</guid>

					<description><![CDATA[<p>Secret protection should keep pace with the way you build software, whether you write code yourself or work with an AI agent. With our new purpose-built model, we&#8217;re bringing context-aware&#8230;</p>
<p>The post <a href="https://github.blog/changelog/2026-10-07-purpose-built-model-for-leaked-secret-detection">Purpose-built model for leaked secret detection</a> appeared first on <a href="https://github.blog">The GitHub Blog</a>.</p>
]]></description>
										<content:encoded><![CDATA[<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">
<html><body><p>Secret protection should keep pace with the way you build software, whether you write code yourself or work with an AI agent. With our new purpose-built model, we&rsquo;re bringing context-aware detection into more developer workflows to help you catch secrets before they&rsquo;re exposed.</p>
<h3 id="whats-new" id="whats-new" ><a class="heading-link" href="#whats-new">What&rsquo;s new<span class="heading-hash pl-2 text-italic text-bold" aria-hidden="true"></span></a></h3>
<p>Today, we&rsquo;re sharing plans for AI secret detection across secret scanning alerts, push protection, and GitHub Copilot security reviews. These features leverage GitHub&rsquo;s fine-tuned model for secret detection. It reads surrounding code to identify likely credentials, including passwords without a recognizable token format, without generating code or prose.</p>
<p>Model availability:</p>
<ul>
<li><strong>Customers with AI-detected Password alerts have automatically been upgraded to the new model.</strong></li>
]]></content:encoded>
					
		
		
		<category domain="changelog-type"><![CDATA[Release]]></category>
<category domain="changelog-label"><![CDATA[application security]]></category>
<category domain="changelog-label"><![CDATA[copilot]]></category>
<post-id xmlns="com-wordpress:feed-additions:1">99342</post-id>	</item>
		<item>
		<title>Local sandboxing for GitHub Copilot now generally available</title>
		<link>https://github.blog/changelog/2026-10-07-local-sandboxing-for-github-copilot-now-generally-available</link>
		
		<dc:creator><![CDATA[Allison]]></dc:creator>
		<pubDate>Wed, 07 Oct 2026 15:46:17 +0000</pubDate>
				<guid isPermaLink="false">https://github.blog/changelog/2026-10-07-local-sandboxing-for-github-copilot-now-generally-available</guid>

					<description><![CDATA[<p>Local sandboxing for GitHub Copilot is now generally available in GitHub Copilot CLI, the GitHub Copilot app, and VS Code sessions using Agent Host. Local sandboxes give developers a secure&#8230;</p>
<p>The post <a href="https://github.blog/changelog/2026-10-07-local-sandboxing-for-github-copilot-now-generally-available">Local sandboxing for GitHub Copilot now generally available</a> appeared first on <a href="https://github.blog">The GitHub Blog</a>.</p>
]]></description>
										<content:encoded><![CDATA[<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">
<html><body><p>Local sandboxing for GitHub Copilot is now generally available in GitHub Copilot CLI, the GitHub Copilot app, and VS Code sessions using Agent Host.</p>
<p>Local sandboxes give developers a secure execution boundary for agentic workflows on their own machines. Tools and commands initiated by Copilot run with restricted access to the filesystem, network, credentials, and other system capabilities, based on policies defined by the developer or their organization.</p>
<p>Local sandboxing is powered by <a href="https://github.com/microsoft/mxc">Microsoft eXecution Container (MXC)</a>, which translates a common sandbox policy into native operating-system controls across Windows, macOS, and Linux.</p>
<p>With local sandboxing, developers and organizations can:</p>
<ul>
<li>Limit the files and directories that agent-run commands can read or modify.</li>
<li>Control access to the internet, local networks, Git credentials, and GitHub CLI credentials.</li>
]]></content:encoded>
					
		
		
		<category domain="changelog-type"><![CDATA[Release]]></category>
<category domain="changelog-label"><![CDATA[application security]]></category>
<category domain="changelog-label"><![CDATA[copilot]]></category>
<category domain="changelog-label"><![CDATA[platform governance]]></category>
<post-id xmlns="com-wordpress:feed-additions:1">99339</post-id>	</item>
		<item>
		<title>Discover local models in GitHub Copilot CLI</title>
		<link>https://github.blog/changelog/2026-10-07-discover-local-models-in-github-copilot-cli</link>
		
		<dc:creator><![CDATA[Allison]]></dc:creator>
		<pubDate>Wed, 07 Oct 2026 15:46:13 +0000</pubDate>
				<guid isPermaLink="false">https://github.blog/changelog/2026-10-07-discover-local-models-in-github-copilot-cli</guid>

					<description><![CDATA[<p>GitHub Copilot CLI makes it easier to choose a local model without leaving your existing workflow. Starting in CLI version 1.0.94-0, use /model to discover supported models from a running&#8230;</p>
<p>The post <a href="https://github.blog/changelog/2026-10-07-discover-local-models-in-github-copilot-cli">Discover local models in GitHub Copilot CLI</a> appeared first on <a href="https://github.blog">The GitHub Blog</a>.</p>
]]></description>
										<content:encoded><![CDATA[<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN" "http://www.w3.org/TR/REC-html40/loose.dtd">
<html><body><p>GitHub Copilot CLI makes it easier to choose a local model without leaving your existing workflow. Starting in CLI version 1.0.94-0, use <code>/model</code> to discover supported models from a running local Ollama instance, alongside your configured models and cloud models provided by GitHub Copilot.</p>
<p>Discovery doesn&rsquo;t automatically add models. Choose a discovered model, review its provider and endpoint, then confirm <strong>Add and use for this session</strong> or <strong>Add without switching</strong>. You can use the model in your current session without restarting the CLI. Ollama and the model must already be installed&mdash;this flow doesn&rsquo;t install a runtime or download models. Models must support tool calling and streaming.</p>
<p>Provider connection failures appear in the picker with an explanation, helping you identify what needs attention.</p>
]]></content:encoded>
					
		
		
		<category domain="changelog-type"><![CDATA[Improvement]]></category>
<category domain="changelog-label"><![CDATA[copilot]]></category>
<post-id xmlns="com-wordpress:feed-additions:1">99338</post-id>	</item>
	</channel>
</rss>
`
