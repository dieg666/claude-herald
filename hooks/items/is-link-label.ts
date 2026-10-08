const LINK_LABEL =
  /^(?:\(?\d[\d,.]*[km]?\)?\s+)?(?:comments?|discuss(?:ion)?|link|permalink|source|article|read\s+more|continue\s+reading)(?:\s*\(\d[\d,.]*[km]?\))?[\s.…:>»›-]*$/iu

/**
 * Whether an excerpt is only the label of a link, such as the `Comments` a Hacker News description is reduced to once its anchor is stripped: no text of the item's own.
 *
 * @param text the item's excerpt
 */
export function isLinkLabel(text: string): boolean {
  return LINK_LABEL.test(text.trim())
}
