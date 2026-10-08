import type { Ecosystem } from '../../../types/index.js'

/**
 * Each ecosystem as the pane's headings name it.
 */
export const ECOSYSTEM_LABELS: Readonly<Record<Ecosystem, string>> = {
  npm: 'npm',
  pypi: 'PyPI',
  go: 'Go',
  cargo: 'Cargo',
  rubygems: 'RubyGems',
  packagist: 'Packagist',
  nuget: 'NuGet',
  maven: 'Maven',
  swift: 'Swift',
  pub: 'pub',
}
