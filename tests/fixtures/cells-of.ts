import Band from '../../hooks/band'

type Node = { props?: Record<string, unknown>; children?: unknown[] }

/**
 * The cells a drawn node takes in a terminal: text as its width, a Button as its hotkey (`p: `) and label, a row Box as its children with the Box's gap and left margin.
 *
 * @param node a string or a drawn element
 */
export function cellsOf(node: unknown): number {
  if (typeof node === 'string') {
    return Band.displayWidthOf(node)
  }

  const { props = {}, children = [] } = node as Node

  if (props.label !== undefined) {
    const hotkey = typeof props.hotkey === 'string' ? Band.displayWidthOf(`${props.hotkey}: `) : 0

    return hotkey + Band.displayWidthOf(String(props.label))
  }

  const gap = typeof props.columnGap === 'number' ? props.columnGap : 0
  const margin = typeof props.marginLeft === 'number' ? props.marginLeft : 0
  const widths = children.map(cellsOf)

  return (
    widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1) + margin
  )
}
