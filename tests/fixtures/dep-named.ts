import type { Dependency } from '../../types/index.js'

/**
 * The dependency by this name, declared by this manifest when one is given.
 *
 * @param dependencies what detection found
 * @param name the package name
 * @param manifestPath the declaring manifest
 */
export function depNamed(
  dependencies: readonly Dependency[],
  name: string,
  manifestPath?: string,
): Dependency | undefined {
  return dependencies.find(
    dependency =>
      dependency.name === name &&
      (manifestPath === undefined || dependency.manifestPath === manifestPath),
  )
}
