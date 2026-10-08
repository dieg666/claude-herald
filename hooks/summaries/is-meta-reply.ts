const META = [
  /\baccording to the (?:title|headline)s? (?:alone|only)\b/i,
  /\baccording to the (?:item|article)'s (?:title|headline)\b/i,
  /\b(?:the|its) (?:title|headline) alone\b/i,
  /\bbased (?:solely|only) on (?:the|its) (?:title|headline)\b/i,
  /\bbased on (?:the|its) (?:title|headline) alone\b/i,
  /\b(?:this|the) (?:item|article)(?:'s)? (?:title|text|headline|link|content)\b/i,
  /^\s*(?:this|the) (?:item|article) (?:is an? |describes\b|links\b|announces\b|reports\b|mentions\b|says\b|gives\b|provides\b)/i,
  /\bno further details\b/i,
  /\bonly available text\b/i,
  /\bthe text (?:alone|only|provided|given)\b/i,
  /\b(?:no|without|lack of) (?:further |more |other |usable |additional )?text(?=\s*(?:[.,;:!?)]|$|\s+(?:is|was|beyond|besides|other than|given|provided|available)\b))/i,
]

const REASONING_VERBS =
  'think|check|re-?check|re-?read|reconsider|look|see|summarize|try|start|focus|rephrase|verify|count'

const REASONING = [
  /(?:^|[.!?…]\s*)\s*Wait,/,
  /[.!?…]\s*Hmm+\b/i,
  /^\s*Hmm+[,.…]*\s+(?:I\b|let\b|wait\b|so\b|okay\b|ok\b|actually\b|the (?:item|title|headline|text)\b|this (?:item|article|title)\b)/i,
  new RegExp(`(?:^|[.!?…]\\s*)\\s*Let me (?:${REASONING_VERBS})\\b`),
]

/**
 * Whether a summary reply talks about the item or its text instead of the story, or shows the model's reasoning; such a reply counts as no answer.
 *
 * @param reply the model's text
 */
export function isMetaReply(reply: string): boolean {
  return [...META, ...REASONING].some(pattern => pattern.test(reply))
}
