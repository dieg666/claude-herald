import { xmlAttributeOf } from '../detect/xml-attribute-of.js'
import { githubRepoOf } from './github-repo-of.js'

/**
 * The GitHub repository a module's `?go-get=1` page names: the `go-import` repository URL, else the `go-source` home or directory template (gopkg.in redirects through it).
 *
 * @param html the page
 * @param module the module path, which a meta tag's prefix must cover
 */
export function goMetaRepoOf(html: string, module: string): string | undefined {
  const contents = [...html.matchAll(/<meta\b([^>]*)>/gi)].flatMap(([, attributes = '']) => {
    const name = xmlAttributeOf(attributes, 'name')?.toLowerCase()
    const content = xmlAttributeOf(attributes, 'content')?.split(/\s+/) ?? []
    const [prefix = ''] = content

    return (name === 'go-import' || name === 'go-source') &&
      (module === prefix || module.startsWith(`${prefix}/`))
      ? [{ name, fields: content.slice(1) }]
      : []
  })
  const urls = [
    ...contents.filter(meta => meta.name === 'go-import').map(meta => meta.fields[1]),
    ...contents
      .filter(meta => meta.name === 'go-source')
      .flatMap(meta => meta.fields.slice(0, 2).map(field => field.replace(/\{[^}]*\}/g, ''))),
  ]

  for (const url of urls) {
    const repo = url === undefined ? undefined : githubRepoOf(url)

    if (repo !== undefined) {
      return repo
    }
  }

  return undefined
}
