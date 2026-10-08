import type { Ecosystem } from '../../../types/index.js'

/**
 * Tag prefixes multi-language repositories use for one ecosystem's package (`go/v1.2.3`, `python-v1.2.3`), lowercased.
 */
export const ECOSYSTEM_ALIASES: Readonly<Record<string, Ecosystem>> = {
  npm: 'npm',
  js: 'npm',
  javascript: 'npm',
  node: 'npm',
  nodejs: 'npm',
  ts: 'npm',
  typescript: 'npm',
  pypi: 'pypi',
  py: 'pypi',
  python: 'pypi',
  go: 'go',
  golang: 'go',
  cargo: 'cargo',
  rust: 'cargo',
  rubygems: 'rubygems',
  ruby: 'rubygems',
  gem: 'rubygems',
  packagist: 'packagist',
  php: 'packagist',
  composer: 'packagist',
  nuget: 'nuget',
  dotnet: 'nuget',
  csharp: 'nuget',
  maven: 'maven',
  java: 'maven',
  kotlin: 'maven',
  swift: 'swift',
  pub: 'pub',
  dart: 'pub',
  flutter: 'pub',
}
