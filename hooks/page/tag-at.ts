import { decodeEntities } from './decode-entities.js'
import type { Tag } from './tag.js'

const isSpace = (character: string | undefined) =>
  character === ' ' ||
  character === '\t' ||
  character === '\n' ||
  character === '\r' ||
  character === '\f'

const isLetter = (character: string | undefined) =>
  character !== undefined && /[A-Za-z]/.test(character)

/**
 * The tag that starts at a `<`, with quoted attribute values read whole so a `>` inside one does
 * not end the tag.
 *
 * @param html the markup
 * @param start the index of the `<`
 * @returns the tag, or undefined when the `<` does not start one
 */
export const tagAt = (html: string, start: number): Tag | undefined => {
  const closing = html[start + 1] === '/'
  const nameStart = start + (closing ? 2 : 1)

  if (!isLetter(html[nameStart])) {
    return undefined
  }

  let index = nameStart

  while (
    index < html.length &&
    !isSpace(html[index]) &&
    html[index] !== '/' &&
    html[index] !== '>'
  ) {
    index++
  }

  const name = html.slice(nameStart, index).toLowerCase()
  const attributes = new Map<string, string>()
  let selfClosing = false

  while (index < html.length) {
    const character = html[index]

    if (character === '>') {
      return { name, closing, selfClosing, attributes, end: index + 1 }
    }

    if (isSpace(character) || character === '/') {
      selfClosing = character === '/'
      index++
      continue
    }

    selfClosing = false

    const attributeStart = index

    // A leading `=` belongs to the name, as in browsers.
    index++

    while (
      index < html.length &&
      !isSpace(html[index]) &&
      html[index] !== '=' &&
      html[index] !== '>' &&
      html[index] !== '/'
    ) {
      index++
    }

    const attribute = html.slice(attributeStart, index).toLowerCase()

    while (isSpace(html[index])) {
      index++
    }

    if (html[index] !== '=') {
      if (!attributes.has(attribute)) {
        attributes.set(attribute, '')
      }

      continue
    }

    index++

    while (isSpace(html[index])) {
      index++
    }

    const quote = html[index]
    let value: string

    if (quote === '"' || quote === "'") {
      const close = html.indexOf(quote, index + 1)

      if (close === -1) {
        return { name, closing, selfClosing: false, attributes, end: html.length }
      }

      value = html.slice(index + 1, close)
      index = close + 1
    } else {
      const valueStart = index

      while (index < html.length && !isSpace(html[index]) && html[index] !== '>') {
        index++
      }

      value = html.slice(valueStart, index)
    }

    if (!attributes.has(attribute)) {
      attributes.set(attribute, decodeEntities(value))
    }
  }

  return { name, closing, selfClosing: false, attributes, end: html.length }
}
