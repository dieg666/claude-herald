/**
 * Hostile markup: upper-case tags, an unclosed head, comments, a script that mentions a closing
 * tag, every kind of link, and elements left open.
 */
export const MESSY_PAGE_HTML = `<!DOCTYPE html>
<HTML><HEAD><TITLE>TITLE_MARKER</TITLE><SCRIPT>var x = "</div> HEAD_SCRIPT_MARKER";</SCRIPT>
<BODY>
<!-- COMMENT_MARKER <a href="/hidden">hidden</a> -->
<H1 CLASS=big>News &amp; Updates</H1>
<P>First <A HREF="/news/foo?a=1&amp;b=2" title='x > y'>Foo &amp; Bar</A>
<p>Protocol relative <a href='//cdn.example.org/post'>CDN post</a>
<ul><li><a href="javascript:alert(1)">Evil js</a><li><a href="mailto:a@b.c">Mail us</a><li><a href="#top">Top</a><li><a href="tel:+15550100">Call</a>
<li><a href=relative/page.html>Relative page</a>
<li><a href="https://other.example/x#frag">Absolute</a>
<li><a href="  /spaced  ">Spaced</a>
</ul>
<script>
//<![CDATA[
document.write('<a href="/nope">SCRIPT_MARKER</a>');
//]]>
</script>
<style>.a{color:red} STYLE_MARKER</style>
<svg width=10><path d="M0"/><text>SVG_MARKER</text><svg><text>NESTED_SVG_MARKER</text></svg>AFTER_NESTED_SVG_MARKER</svg>
<noscript><img src=x> NOSCRIPT_MARKER</noscript>
<a href="/img-only"><img src="logo.png"></a>
<span>Date</span><span>Sep 22, 2026</span>
Caf&eacute; &#8212; &#x1F600; &nbsp;&nbsp; &unknown; &amp;lt;
<a href="/unclosed">Unclosed link text
<b>Bold <i>unclosed`
