/**
 * Every color prop (`color`, `backgroundColor`, `borderColor`) anywhere in a drawn tree, in document order.
 *
 * @param node a tree as `ui.drawn()` returns it
 */
export function colorsOf(node: unknown): string[] {
  if (typeof node !== 'object' || node === null) {
    return []
  }

  const { props, children } = node as { props?: Record<string, unknown>; children?: unknown[] }
  const own = ['color', 'backgroundColor', 'borderColor'].flatMap(name =>
    props !== undefined && props[name] !== undefined ? [String(props[name])] : [],
  )

  return [...own, ...(children ?? []).flatMap(colorsOf)]
}
