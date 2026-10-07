import { recordAt } from '../detect/record-at.js'
import { lookupJson } from './lookup-json.js'
import type { RegistryLookup } from './registry-lookup.js'
import { repoLookupOf } from './repo-lookup-of.js'

/**
 * `project_urls` labels that name the source repository, normalized to lower-case letters and digits.
 */
const SOURCE_LABELS = new Set([
  'source',
  'sourcecode',
  'code',
  'repository',
  'repo',
  'github',
  'git',
  'sourcerepository',
])

/**
 * `project_urls` labels that name the home page, normalized the same way.
 */
const HOME_LABELS = new Set(['homepage', 'home'])

/**
 * PyPI: `project_urls` whose label names the source (`Source`, `Source Code`, `Repository`, `GitHub`, any case), then the home page ones, then `home_page`, then every other URL, from pypi.org's JSON API.
 */
export const pypiLookup: RegistryLookup = (get, dependency) => {
  if (!/^[\w.-]+$/.test(dependency.name)) {
    return Promise.resolve({ kind: 'none', reason: 'not a PyPI project name' })
  }

  return lookupJson(get, `https://pypi.org/pypi/${dependency.name}/json`, json => {
    const info = recordAt(json, 'info')
    const labelled = Object.entries(recordAt(info, 'project_urls')).map(
      ([label, url]) => [label.toLowerCase().replace(/[^a-z\d]/g, ''), url] as const,
    )
    const urlsWhere = (test: (label: string) => boolean) =>
      labelled.filter(([label]) => test(label)).map(([, url]) => url)

    return repoLookupOf([
      ...urlsWhere(label => SOURCE_LABELS.has(label)),
      ...urlsWhere(label => HOME_LABELS.has(label)),
      info.home_page,
      ...urlsWhere(label => !SOURCE_LABELS.has(label) && !HOME_LABELS.has(label)),
    ])
  })
}
