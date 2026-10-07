import { recordAt } from '../detect/record-at.js'
import { githubRepoOf } from './github-repo-of.js'
import { GO_IMPORT_HOSTS } from './go-import-hosts.js'
import { goMetaRepoOf } from './go-meta-repo-of.js'
import { goModuleRepoOf } from './go-module-repo-of.js'
import { goProxyPathOf } from './go-proxy-path-of.js'
import { jsonOf } from './json-of.js'
import type { Lookup } from './lookup.js'
import type { RegistryLookup } from './registry-lookup.js'

/**
 * Go: a `github.com/` or `golang.org/x/` module path directly; else the Go proxy's `@latest` origin, then, for a known vanity host, the module's `go-import` page.
 */
export const goLookup: RegistryLookup = async (get, dependency) => {
  const module = dependency.name
  const direct = goModuleRepoOf(module)

  if (direct !== undefined) {
    return { kind: 'repo', repo: direct }
  }

  if (!/^[a-z\d.-]+\.[a-z]+(?:\/[\w.~-]+)*$/i.test(module)) {
    return { kind: 'none', reason: 'not a Go module path' }
  }

  const latest = await get(`https://proxy.golang.org/${goProxyPathOf(module)}/@latest`)

  if (latest.kind === 'failed') {
    return latest
  }

  const origin = latest.kind === 'ok' ? recordAt(jsonOf(latest.text), 'Origin').URL : undefined
  const fromProxy = typeof origin === 'string' ? githubRepoOf(origin) : undefined

  if (fromProxy !== undefined) {
    return { kind: 'repo', repo: fromProxy }
  }

  const host = module.split('/')[0]?.toLowerCase() ?? ''
  const elsewhere: Lookup = {
    kind: 'none',
    reason:
      typeof origin === 'string'
        ? `repository not on GitHub: ${origin}`
        : 'no GitHub origin from the Go proxy',
  }

  if (!GO_IMPORT_HOSTS.includes(host)) {
    return elsewhere
  }

  const page = await get(`https://${module}?go-get=1`)

  if (page.kind === 'failed') {
    return page
  }

  const fromMeta = page.kind === 'ok' ? goMetaRepoOf(page.text, module) : undefined

  return fromMeta === undefined ? elsewhere : { kind: 'repo', repo: fromMeta }
}
