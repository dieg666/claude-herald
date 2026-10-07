import { rawTextEnd } from './raw-text-end.js'
import { tagAt } from './tag-at.js'

const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title'])

/**
 * Where an element whose content is dropped ends, counting nested elements of the same name. A
 * head also ends where the body starts, and an element that never closes runs to the end.
 *
 * @param html the markup
 * @param from the index just past the element's start tag
 * @param name the element name in lower case
 * @returns the index to resume reading from
 */
export const skippedElementEnd = (html: string, from: number, name: string) => {
  let depth = 1
  let index = from

  while (index < html.length) {
    const open = html.indexOf('<', index)

    if (open === -1) {
      break
    }

    if (html.startsWith('<!--', open)) {
      const close = html.indexOf('-->', open + 2)

      index = close === -1 ? html.length : close + 3
      continue
    }

    const tag = tagAt(html, open)

    if (tag === undefined) {
      index = open + 1
      continue
    }

    index = tag.end

    if (!tag.closing && RAW_TEXT.has(tag.name)) {
      index = rawTextEnd(html, index, tag.name)
      continue
    }

    if (name === 'head' && !tag.closing && tag.name === 'body') {
      return open
    }

    if (tag.name !== name) {
      continue
    }

    if (tag.closing) {
      depth--

      if (depth === 0) {
        return index
      }
    } else if (!(tag.selfClosing && name === 'svg')) {
      depth++
    }
  }

  return html.length
}
