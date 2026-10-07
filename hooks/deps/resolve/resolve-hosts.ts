import { GO_IMPORT_HOSTS } from './go-import-hosts.js'

/**
 * Every host resolving packages to feeds may contact.
 */
export const RESOLVE_HOSTS: readonly string[] = [
  'registry.npmjs.org',
  'pypi.org',
  'crates.io',
  'proxy.golang.org',
  'rubygems.org',
  'repo.packagist.org',
  'api.nuget.org',
  'repo1.maven.org',
  'github.com',
  ...GO_IMPORT_HOSTS,
]
