import type { Dependency } from '../../../types/index.js'

/**
 * The key a package's feed mapping is cached and overridden under: `<ecosystem>:<name>`.
 *
 * @param dependency the package
 */
export function depFeedKeyOf(dependency: Pick<Dependency, 'ecosystem' | 'name'>): string {
  return `${dependency.ecosystem}:${dependency.name}`
}
