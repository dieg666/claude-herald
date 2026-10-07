/**
 * What to send the model to summarize one item.
 */
export type SummaryRequest = {
  /** The standing instructions, which never contain item content. */
  system: string
  /** The request, which carries the item as data. */
  prompt: string
}
