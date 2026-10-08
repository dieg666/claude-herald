import type { Ecosystem } from '../../../types/index.js'
import { cargoLookup } from './cargo-lookup.js'
import { goLookup } from './go-lookup.js'
import { mavenLookup } from './maven-lookup.js'
import { npmLookup } from './npm-lookup.js'
import { nugetLookup } from './nuget-lookup.js'
import { packagistLookup } from './packagist-lookup.js'
import { pypiLookup } from './pypi-lookup.js'
import type { RegistryLookup } from './registry-lookup.js'
import { rubygemsLookup } from './rubygems-lookup.js'

/**
 * The registry lookup of each ecosystem; Swift, Dart and repositories followed by hand have none, so only a GitHub source URL resolves them.
 */
export const REGISTRY_LOOKUPS: Readonly<Record<Ecosystem, RegistryLookup | undefined>> = {
  npm: npmLookup,
  pypi: pypiLookup,
  go: goLookup,
  cargo: cargoLookup,
  rubygems: rubygemsLookup,
  packagist: packagistLookup,
  nuget: nugetLookup,
  maven: mavenLookup,
  swift: undefined,
  pub: undefined,
  github: undefined,
}
