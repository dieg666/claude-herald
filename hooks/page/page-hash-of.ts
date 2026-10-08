import { contentHashOf } from './content-hash-of.js'
import type { ExtractionRequest } from './extraction-request.js'

/**
 * The fingerprint of the extraction request for a page, so the page is read again when its text or the extraction rules change.
 *
 * @param request what extractionRequestOf made of the page's address and text
 */
export const pageHashOf = ({ system, prompt }: ExtractionRequest) =>
  contentHashOf(`${system}\n${prompt}`)
