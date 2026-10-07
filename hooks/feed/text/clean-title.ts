import { FEED_LIMITS } from '../feed-limits.js'
import { decodeEntities } from '../xml/decode-entities.js'
import { clipText } from './clip-text.js'
import { cleanText } from './clean-text.js'
import { htmlToText } from './html-to-text.js'
import { INLINE_TAG } from './inline-tag.js'

const HAS_REFERENCE = /&(?:#\d+|#[xX][0-9A-Fa-f]+|[A-Za-z][A-Za-z0-9]*);/

/** A title as clean text: double-encoded entities decoded, stray inline tags removed, capped. */
export function cleanTitle(value: string, isHtml: boolean): string {
  let text = isHtml ? htmlToText(value) : value

  for (let pass = 0; pass < FEED_LIMITS.entityPasses && HAS_REFERENCE.test(text); pass++) {
    const decoded = decodeEntities(text)

    if (decoded === text) {
      break
    }

    text = decoded
  }

  return clipText(cleanText(text.replace(INLINE_TAG, '')), FEED_LIMITS.titleChars)
}
