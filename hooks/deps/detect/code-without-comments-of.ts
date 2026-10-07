/**
 * Source text with `//` and `/* *\/` comments removed, string literals left intact (Groovy, Kotlin, Swift).
 *
 * @param text the source
 */
export function codeWithoutCommentsOf(text: string): string {
  let out = ''
  let quote = ''

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? ''

    if (quote !== '') {
      out += char

      if (char === '\\') {
        out += text[index + 1] ?? ''
        index += 1
      } else if (char === quote || char === '\n') {
        quote = ''
      }
    } else if (char === '"' || char === "'") {
      quote = char
      out += char
    } else if (char === '/' && text[index + 1] === '/') {
      while (index < text.length && text[index] !== '\n') {
        index += 1
      }

      out += '\n'
    } else if (char === '/' && text[index + 1] === '*') {
      const end = text.indexOf('*/', index + 2)

      index = end < 0 ? text.length : end + 1
    } else {
      out += char
    }
  }

  return out
}
