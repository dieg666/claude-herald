const META = [
  /\baccording to the (?:item'?s? |article'?s? )?(?:title|headline)\b/i,
  /\b(?:the|its) (?:title|headline) alone\b/i,
  /\bbased (?:solely |only )?on the (?:title|headline)\b/i,
  /\bthis (?:item|article)\b/i,
  /\bthe item's\b/i,
  /\bno further details\b/i,
  /\bonly available text\b/i,
  /\b(?:in|from|beyond|per) the text\b/i,
  /\bthe text(?=\s*(?:[.,;:!?)]|$))/i,
  /\bthe text (?:says|states|mentions|gives|provides|offers|does|doesn't|is|only|itself|alone|contains|describes|notes|lacks)\b/i,
]

const REASONING = [/\bWait,/, /\bhmm+\b/i, /(?:^|[.!?:;…]\s*|\n\s*)Let me\b/]

/**
 * Whether a summary reply talks about the item or its text instead of the story, or shows the model's reasoning; such a reply counts as no answer.
 *
 * @param reply the model's text
 */
export function isMetaReply(reply: string): boolean {
  return [...META, ...REASONING].some(pattern => pattern.test(reply))
}
