import type { Dependency } from '../../types/index.js'

/**
 * An npm dependency by name, runtime and root-declared unless told otherwise.
 *
 * @param name the package
 * @param fields what differs
 */
export function depAt(name: string, fields: Partial<Dependency> = {}): Dependency {
  return {
    ecosystem: 'npm',
    name,
    isDev: false,
    isRoot: true,
    manifestPath: 'package.json',
    ...fields,
  }
}
