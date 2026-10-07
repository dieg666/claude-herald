import { collapsedTextOf } from './collapsed-text-of.js'
import { cutTo } from './cut-to.js'
import { decodeEntities } from './decode-entities.js'
import { PAGE_TEXT_CAP } from './page-text-cap.js'
import { rawTextEnd } from './raw-text-end.js'
import { resolvePageUrl } from './resolve-page-url.js'
import { skippedElementEnd } from './skipped-element-end.js'
import { tagAt } from './tag-at.js'

const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title'])

const SKIPPED = new Set(['head', 'noscript', 'svg', 'template'])

// Tags that sit inside a word; every other tag separates words.
const INLINE = new Set([
  'abbr',
  'b',
  'bdi',
  'bdo',
  'cite',
  'code',
  'em',
  'font',
  'i',
  'kbd',
  'mark',
  'q',
  's',
  'samp',
  'small',
  'strong',
  'sub',
  'sup',
  'u',
  'var',
  'wbr',
])

const BLOCK = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'br',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'summary',
  'table',
  'tr',
  'ul',
])

/**
 * A page's markup as plain text a model can read, with each http(s) link's resolved target kept.
 *
 * @param html the page's markup, which may be malformed
 * @param pageUrl the page's address, which relative links resolve against
 * @param cap the most characters to return
 * @returns lines of text, a one-line link as `text <url>` and a link over several lines headed by `<url>` on its own line
 */
export const htmlToText = (html: string, pageUrl: string, cap = PAGE_TEXT_CAP) => {
  const parts: string[] = []
  let visible = 0
  let link: { url: string; visibleAtOpen: number; partsAtOpen: number } | undefined

  const text = (raw: string) => {
    const piece = collapsedTextOf(decodeEntities(raw))

    if (piece === '') {
      return
    }

    parts.push(piece)
    visible += piece.length - (piece.match(/ /g)?.length ?? 0)
  }

  const textLinesFrom = (from: number) => {
    let lines = 0
    let inLine = false

    for (let at = from; at < parts.length; at++) {
      const part = parts[at] ?? ''

      if (part === '\n') {
        inLine = false
      } else if (!inLine && part.trim() !== '') {
        lines++
        inLine = true
      }
    }

    return lines
  }

  const closeLink = () => {
    if (link !== undefined && visible > link.visibleAtOpen && textLinesFrom(link.partsAtOpen) > 1) {
      const heading = `<${link.url}>`

      parts.splice(link.partsAtOpen, 0, '\n', heading, '\n')
      visible += heading.length
    } else if (link !== undefined && visible > link.visibleAtOpen) {
      const trailing: string[] = []

      while (parts.length > 0 && parts[parts.length - 1]?.trim() === '') {
        trailing.push(parts.pop() ?? '')
      }

      const target = ` <${link.url}>`

      parts.push(target, ...trailing.reverse())
      visible += target.length - 2
    }

    link = undefined
  }

  let index = 0

  while (index < html.length && visible <= cap) {
    const open = html.indexOf('<', index)

    if (open === -1) {
      text(html.slice(index))
      break
    }

    text(html.slice(index, open))

    if (html.startsWith('<!--', open)) {
      const close = html.indexOf('-->', open + 2)

      index = close === -1 ? html.length : close + 3
      continue
    }

    if (html.startsWith('<![CDATA[', open)) {
      const close = html.indexOf(']]>', open + 9)

      text(html.slice(open + 9, close === -1 ? html.length : close))
      index = close === -1 ? html.length : close + 3
      continue
    }

    if (html[open + 1] === '!' || html[open + 1] === '?') {
      const close = html.indexOf('>', open + 2)

      index = close === -1 ? html.length : close + 1
      continue
    }

    const tag = tagAt(html, open)

    if (tag === undefined) {
      text('<')
      index = open + 1
      continue
    }

    index = tag.end

    if (tag.closing) {
      if (tag.name === 'a') {
        closeLink()
        parts.push(' ')
      } else if (BLOCK.has(tag.name)) {
        parts.push('\n')
      } else if (!INLINE.has(tag.name)) {
        parts.push(' ')
      }

      continue
    }

    if (RAW_TEXT.has(tag.name)) {
      parts.push(' ')
      index = rawTextEnd(html, index, tag.name)
      continue
    }

    if (SKIPPED.has(tag.name)) {
      parts.push(' ')

      if (!(tag.selfClosing && tag.name === 'svg')) {
        index = skippedElementEnd(html, index, tag.name)
      }

      continue
    }

    if (tag.name === 'a') {
      closeLink()
      parts.push(' ')

      const url = resolvePageUrl(tag.attributes.get('href') ?? '', pageUrl)

      link =
        url === undefined ? undefined : { url, visibleAtOpen: visible, partsAtOpen: parts.length }
    } else if (BLOCK.has(tag.name)) {
      parts.push('\n')
    } else if (!INLINE.has(tag.name)) {
      parts.push(' ')
    }
  }

  closeLink()

  const lines = parts
    .join('')
    .split('\n')
    .map(line => line.replace(/ {2,}/g, ' ').trim())
    .filter(line => line !== '')
  const joined = lines.join('\n')

  if (joined.length <= cap) {
    return joined
  }

  const lineEnd = joined.lastIndexOf('\n', cap)

  return lineEnd > cap / 2 ? joined.slice(0, lineEnd) : cutTo(joined, cap).trimEnd()
}
