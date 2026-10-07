import { FEED_LIMITS } from '../feed-limits.js'
import { decodeEntities } from '../xml/decode-entities.js'
import { BLOCK_TAGS } from './block-tags.js'
import { cleanText } from './clean-text.js'
import { HIDDEN_TAGS } from './hidden-tags.js'

const TAG_NAME = /[A-Za-z][A-Za-z0-9-]*/y

const HAS_TAG = /<\/?[A-Za-z]/

const HAS_ESCAPED_TAG = /&(?:amp;)*lt;\/?[A-Za-z]/i

/** An HTML fragment as one line of plain text: tags, comments and scripts removed, entities decoded. */
export function htmlToText(html: string): string {
  let source = html.slice(0, FEED_LIMITS.htmlSourceChars)

  for (let pass = 0; pass < 2 && !HAS_TAG.test(source) && HAS_ESCAPED_TAG.test(source); pass++) {
    source = decodeEntities(source)
  }

  const lower = source.toLowerCase()
  const pieces: string[] = []
  let pos = 0

  while (pos < source.length) {
    const lt = source.indexOf('<', pos)

    if (lt < 0) {
      pieces.push(source.slice(pos))
      break
    }

    pieces.push(source.slice(pos, lt))

    if (source.startsWith('<!--', lt)) {
      const end = source.indexOf('-->', lt + 4)
      pos = end < 0 ? source.length : end + 3
      continue
    }

    const closing = source.charCodeAt(lt + 1) === 47
    TAG_NAME.lastIndex = lt + (closing ? 2 : 1)
    const name = TAG_NAME.exec(source)?.[0]?.toLowerCase()
    const special = source.charCodeAt(lt + 1) === 33 || source.charCodeAt(lt + 1) === 63

    if (name === undefined && !special) {
      pieces.push('<')
      pos = lt + 1
      continue
    }

    const end = source.indexOf('>', lt)

    if (end < 0) {
      break
    }

    pos = end + 1

    if (name === undefined) {
      continue
    }

    if (!closing && HIDDEN_TAGS.has(name) && source.charCodeAt(end - 1) !== 47) {
      const stop = lower.indexOf(`</${name}`, pos)
      const stopEnd = stop < 0 ? -1 : lower.indexOf('>', stop)
      pos = stopEnd < 0 ? source.length : stopEnd + 1
      continue
    }

    pieces.push(BLOCK_TAGS.has(name) ? ' ' : '')
  }

  return cleanText(decodeEntities(pieces.join('')))
}
