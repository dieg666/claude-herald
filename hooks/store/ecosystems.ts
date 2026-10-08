import type { Ecosystem } from '../../types/index.js'

/**
 * Every ecosystem a stored dependency may name.
 */
export const ECOSYSTEMS: readonly Ecosystem[] = [
  'npm',
  'pypi',
  'go',
  'cargo',
  'rubygems',
  'packagist',
  'nuget',
  'maven',
  'swift',
  'pub',
  'github',
]
