/**
 * A synthetic GitHub releases feed of `owner/<repo>`: one entry per tag, newest first, a day apart before 2026-03-01, each with its notes as escaped HTML.
 *
 * @param repo the repository's name
 * @param releases tag and notes pairs, newest first
 */
export function releasesAtomOf(repo: string, releases: readonly (readonly [string, string?])[]) {
  const escaped = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const entries = releases.map(([tag, notes = `Changes in ${tag}.`], index) => {
    const updated = new Date(Date.UTC(2026, 2, 1) - index * 86_400_000).toISOString()

    return (
      `<entry><id>tag:github.com,2008:Repository/1/${tag}</id><updated>${updated}</updated>` +
      `<link rel="alternate" type="text/html" href="https://github.com/owner/${repo}/releases/tag/${tag}"/>` +
      `<title>${tag}</title><content type="html">${escaped(`<p>${notes}</p>`)}</content></entry>`
    )
  })

  return (
    `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom">` +
    `<id>tag:github.com,2008:https://github.com/owner/${repo}/releases</id>` +
    `<link type="text/html" rel="alternate" href="https://github.com/owner/${repo}/releases"/>` +
    `<title>Release notes from ${repo}</title>${entries.join('')}</feed>`
  )
}
