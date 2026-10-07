import { FEED_LIMITS } from '../feed-limits.js'
import { decodeEntities } from './decode-entities.js'
import type { XmlElement } from './xml-element.js'
import type { XmlScan } from './xml-scan.js'

const NAME = /[A-Za-z_:\u00C0-\uFFFF][^\s/>"'=<]*/y

const isSpace = (code: number) => code === 32 || code === 9 || code === 10 || code === 13

const isNameEnd = (code: number) =>
  Number.isNaN(code) ||
  isSpace(code) ||
  code === 61 ||
  code === 47 ||
  code === 62 ||
  code === 34 ||
  code === 39 ||
  code === 60

/** Scans XML into a tree in one forward pass, tolerating stray and unclosed tags; never throws. */
export function scanXml(xml: string): XmlScan {
  const stack: XmlElement[] = []
  const overflow: string[] = []
  let root: XmlElement | undefined
  let pos = 0

  const append = (raw: string, decode: boolean) => {
    const top = stack.at(-1)

    if (!top || raw === '') {
      return
    }

    const text = decode ? decodeEntities(raw) : raw
    const last = top.children.length - 1
    const previous = top.children[last]

    if (typeof previous === 'string') {
      top.children[last] = previous + text
    } else {
      top.children.push(text)
    }
  }

  const reachOf = <T>(items: readonly T[], matches: (item: T) => boolean) => {
    for (
      let index = items.length - 1;
      index >= 0 && index >= items.length - FEED_LIMITS.endTagReach;
      index--
    ) {
      if (matches(items[index] as T)) {
        return index
      }
    }

    return -1
  }

  const close = (name: string) => {
    const deep = reachOf(overflow, open => open === name)

    if (deep >= 0) {
      overflow.length = deep
      return
    }

    const shallow = reachOf(stack, open => open.name === name)

    if (shallow >= 0) {
      overflow.length = 0
      stack.length = shallow
    }
  }

  const open = (element: XmlElement, selfClosing: boolean) => {
    if (overflow.length > 0 || stack.length >= FEED_LIMITS.depth) {
      if (!selfClosing) {
        overflow.push(element.name)
      }

      return
    }

    const top = stack.at(-1)

    if (top) {
      top.children.push(element)
    } else if (root) {
      return
    } else {
      root = element
    }

    if (!selfClosing) {
      stack.push(element)
    }
  }

  while (pos < xml.length) {
    const lt = xml.indexOf('<', pos)

    if (lt < 0) {
      append(xml.slice(pos), true)
      break
    }

    append(xml.slice(pos, lt), true)

    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt + 4)

      if (end < 0) {
        return { root, closed: false }
      }

      pos = end + 3
      continue
    }

    if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt + 9)

      if (end < 0) {
        return { root, closed: false }
      }

      append(xml.slice(lt + 9, end), false)
      pos = end + 3
      continue
    }

    if (xml.startsWith('<?', lt)) {
      const end = xml.indexOf('?>', lt + 2)

      if (end < 0) {
        return { root, closed: false }
      }

      pos = end + 2
      continue
    }

    if (xml.startsWith('<!', lt)) {
      let end = xml.indexOf('>', lt + 2)
      const subset = end < 0 ? -1 : xml.slice(lt + 2, end).indexOf('[')

      if (subset >= 0) {
        const subsetEnd = xml.indexOf(']', lt + 2 + subset)
        end = subsetEnd < 0 ? -1 : xml.indexOf('>', subsetEnd)
      }

      if (end < 0) {
        return { root, closed: false }
      }

      pos = end + 1
      continue
    }

    if (xml.charCodeAt(lt + 1) === 47) {
      const end = xml.indexOf('>', lt + 2)

      if (end < 0) {
        return { root, closed: false }
      }

      close(xml.slice(lt + 2, end).trim())
      pos = end + 1

      if (root && stack.length === 0) {
        return { root, closed: true }
      }

      continue
    }

    NAME.lastIndex = lt + 1
    const name = NAME.exec(xml)?.[0]

    if (name === undefined) {
      append('<', false)
      pos = lt + 1
      continue
    }

    const attrs = new Map<string, string>()
    let index = lt + 1 + name.length
    let selfClosing = false
    let ended = false

    while (index < xml.length) {
      const code = xml.charCodeAt(index)

      if (isSpace(code)) {
        index++
      } else if (code === 62) {
        index++
        ended = true
        break
      } else if (code === 47 && xml.charCodeAt(index + 1) === 62) {
        index += 2
        selfClosing = true
        ended = true
        break
      } else if (isNameEnd(code)) {
        index++
      } else {
        const start = index

        while (!isNameEnd(xml.charCodeAt(index))) {
          index++
        }

        const key = xml.slice(start, index)

        while (isSpace(xml.charCodeAt(index))) {
          index++
        }

        if (xml.charCodeAt(index) !== 61) {
          attrs.set(key, '')
          continue
        }

        index++

        while (isSpace(xml.charCodeAt(index))) {
          index++
        }

        const quote = xml.charCodeAt(index)

        if (quote === 34 || quote === 39) {
          const end = xml.indexOf(quote === 34 ? '"' : "'", index + 1)

          if (end < 0) {
            return { root, closed: false }
          }

          attrs.set(key, decodeEntities(xml.slice(index + 1, end)))
          index = end + 1
        } else {
          const start = index

          while (
            index < xml.length &&
            !isSpace(xml.charCodeAt(index)) &&
            xml.charCodeAt(index) !== 62
          ) {
            index++
          }

          attrs.set(key, decodeEntities(xml.slice(start, index)))
        }
      }
    }

    if (!ended) {
      return { root, closed: false }
    }

    open({ name, attrs, children: [] }, selfClosing)
    pos = index

    if (root && stack.length === 0) {
      return { root, closed: true }
    }
  }

  return { root, closed: false }
}
