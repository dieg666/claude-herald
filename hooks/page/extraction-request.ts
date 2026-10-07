/**
 * What to send the model to turn a page's text into items.
 */
export type ExtractionRequest = {
  /** The standing instructions, which never contain page content. */
  system: string
  /** The request, which carries the page text. */
  prompt: string
}
