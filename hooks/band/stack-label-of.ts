import { displayWidthOf } from './display-width-of.js'

/**
 * The package a stack row shows in its source column: the name as it is when it fits `columns` cells, else a scoped name without its scope (`@astrojs/node` gives `node`), still to be cut.
 *
 * @param name the package name, one line
 * @param columns the cells the package may take
 */
export function stackLabelOf(name: string, columns: number): string {
  if (displayWidthOf(name) <= columns) {
    return name
  }

  const scoped = /^@[^/]+\/(.+)$/.exec(name)

  return scoped?.[1] ?? name
}
