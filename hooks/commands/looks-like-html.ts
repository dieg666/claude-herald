/**
 * Whether a response body reads as an HTML document rather than a feed or plain text.
 *
 * @param text the body
 */
export function looksLikeHtml(text: string): boolean {
  return /<(?:!doctype\s+html|html|head|body)[\s>]/i.test(text.slice(0, 20_000))
}
