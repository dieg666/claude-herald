import { cellsOf } from './cells-of.js'
import { wrappedRowsOf } from './wrapped-rows-of.js'

type Node = { type?: string; props?: Record<string, unknown>; children?: unknown[] }

/**
 * How many rows a drawn node takes at `columns` cells: a column Box stacks its children, a row Box wraps them greedily with its own gap (an overflowing row shows as extra rows), anything else is one row.
 *
 * @param node a drawn element or a string
 * @param columns the cells a row may take
 */
export function rowsOf(node: unknown, columns: number): number {
  if (typeof node === 'string') {
    return 1
  }

  const { type, props = {}, children = [] } = node as Node

  if (type !== 'Box') {
    return 1
  }

  return props.flexDirection === 'column'
    ? children.reduce<number>((sum, child) => sum + rowsOf(child, columns), 0)
    : wrappedRowsOf(
        children.map(cellsOf),
        columns,
        typeof props.columnGap === 'number' ? props.columnGap : 0,
      )
}
