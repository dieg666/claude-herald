/**
 * An XML text with comments removed and CDATA sections unwrapped; throws when it holds no element named `root` or the element is not closed.
 *
 * @param text the document
 * @param root the root element's name, as the format spells it
 */
export function xmlWithoutCommentsOf(text: string, root: string): string {
  const clean = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')

  if (
    !new RegExp(`<${root}\\b`).test(clean) ||
    !new RegExp(`</${root}\\s*>|<${root}\\b[^>]*/>`).test(clean)
  ) {
    throw new Error(`not a complete <${root}> document`)
  }

  return clean
}
