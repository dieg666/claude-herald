import { NAMED_ENTITIES } from './named-entities.js'
import { WINDOWS_1252 } from './windows-1252.js'

const REFERENCE = /&(?:#(\d{1,7})|#[xX]([0-9A-Fa-f]{1,6})|([A-Za-z][A-Za-z0-9]{1,31}));/g

const characterOf = (code: number): string => {
  if (code === 0) {
    return ''
  }

  if (code >= 0x80 && code <= 0x9f) {
    return WINDOWS_1252[code - 0x80] ?? ''
  }

  if (code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
    return '\uFFFD'
  }

  return String.fromCodePoint(code)
}

/** Text with numeric and named character references decoded once (`&amp;amp;` reads `&amp;`). */
export function decodeEntities(text: string): string {
  if (!text.includes('&')) {
    return text
  }

  return text.replace(REFERENCE, (whole: string, decimal?: string, hex?: string, name?: string) => {
    if (name !== undefined) {
      return NAMED_ENTITIES.get(name) ?? whole
    }

    return characterOf(
      decimal !== undefined ? Number.parseInt(decimal, 10) : Number.parseInt(hex ?? '', 16),
    )
  })
}
